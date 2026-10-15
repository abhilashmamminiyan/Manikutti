import { NextResponse } from 'next/server';
import { getAuthUserEmail } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ExtractedTransaction {
  date: string;
  amount: number;
  type: 'Expense' | 'Income';
  category: string;
  description: string;
  note: string;
}

/**
 * Fallback regex/line parser for standard CSV bank statements
 * Supports columns like Date, Description/Narration, Debit, Credit, Balance, etc.
 */
function parseCsvFallback(csvText: string): ExtractedTransaction[] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Find header index
  let headerIndex = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^["']|["']$/g, '').trim().toLowerCase());
    if (cols.some(c => c.includes('date')) && (cols.some(c => c.includes('amount') || c.includes('debit') || c.includes('withdrawal') || c.includes('credit')))) {
      headerIndex = i;
      headers = cols;
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0;
    headers = lines[0].split(',').map(c => c.replace(/^["']|["']$/g, '').trim().toLowerCase());
  }

  const dateIdx = headers.findIndex(c => c.includes('date'));
  const descIdx = headers.findIndex(c => c.includes('narration') || c.includes('description') || c.includes('particulars') || c.includes('remarks'));
  const debitIdx = headers.findIndex(c => c.includes('debit') || c.includes('withdrawal') || c.includes('dr'));
  const creditIdx = headers.findIndex(c => c.includes('credit') || c.includes('deposit') || c.includes('cr'));
  const amountIdx = headers.findIndex(c => c.includes('amount'));

  const results: ExtractedTransaction[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    // Basic CSV comma split respecting quotes
    const rawCols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
    const cols = rawCols.map(c => c.replace(/^["']|["']$/g, '').trim());
    if (cols.length < 2) continue;

    const rawDate = dateIdx >= 0 && cols[dateIdx] ? cols[dateIdx] : '';
    if (!rawDate) continue;

    // Normalize date: support DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
    let parsedDate = '';
    const dMatch = rawDate.match(/^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})/);
    if (dMatch) {
      if (dMatch[1].length === 4) {
        parsedDate = `${dMatch[1]}-${dMatch[2].padStart(2, '0')}-${dMatch[3].padStart(2, '0')}`;
      } else {
        parsedDate = `${dMatch[3].length === 2 ? '20' + dMatch[3] : dMatch[3]}-${dMatch[2].padStart(2, '0')}-${dMatch[1].padStart(2, '0')}`;
      }
    } else {
      continue;
    }

    const description = descIdx >= 0 && cols[descIdx] ? cols[descIdx] : 'Bank Transaction';
    let amount = 0;
    let type: 'Expense' | 'Income' = 'Expense';

    if (debitIdx >= 0 && cols[debitIdx] && parseFloat(cols[debitIdx].replace(/,/g, '')) > 0) {
      amount = parseFloat(cols[debitIdx].replace(/,/g, ''));
      type = 'Expense';
    } else if (creditIdx >= 0 && cols[creditIdx] && parseFloat(cols[creditIdx].replace(/,/g, '')) > 0) {
      amount = parseFloat(cols[creditIdx].replace(/,/g, ''));
      type = 'Income';
    } else if (amountIdx >= 0 && cols[amountIdx]) {
      const cleanAmt = parseFloat(cols[amountIdx].replace(/,/g, ''));
      if (!isNaN(cleanAmt)) {
        amount = Math.abs(cleanAmt);
        type = cleanAmt < 0 ? 'Expense' : 'Expense';
      }
    }

    if (amount > 0) {
      // Smart category guess
      const lower = description.toLowerCase();
      let category = 'General';
      if (lower.includes('swiggy') || lower.includes('zomato') || lower.includes('hotel') || lower.includes('food') || lower.includes('rest')) category = 'Food';
      else if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('uber') || lower.includes('ola')) category = 'Transport';
      else if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('myntra') || lower.includes('retail')) category = 'Shopping';
      else if (lower.includes('salary') || lower.includes('payroll')) { category = 'Salary'; type = 'Income'; }
      else if (lower.includes('electric') || lower.includes('kseb') || lower.includes('bescom') || lower.includes('airtel') || lower.includes('jio')) category = 'Utilities';
      else if (lower.includes('rent') || lower.includes('housing')) category = 'Housing';
      else if (lower.includes('pharmacy') || lower.includes('hospital') || lower.includes('med')) category = 'Health';

      results.push({
        date: parsedDate,
        amount,
        type,
        category,
        description,
        note: description.slice(0, 50),
      });
    }
  }

  return results;
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileBase64, fileName, mimeType } = body;

    if (!fileBase64) {
      return NextResponse.json({ error: 'Missing fileBase64 in request' }, { status: 400 });
    }

    const isPdf = (mimeType && mimeType.includes('pdf')) || (fileName && fileName.toLowerCase().endsWith('.pdf'));
    const isCsv = (mimeType && (mimeType.includes('csv') || mimeType.includes('text'))) || (fileName && fileName.toLowerCase().endsWith('.csv'));

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API Key is available, use multimodal Gemini Flash to parse accurately
    if (apiKey) {
      try {
        const systemInstruction = `
You are an expert banking and financial data extractor for the Manikutti Hub.
Extract ALL individual financial transactions from this bank statement.

For every transaction, output:
- "date": Date in "YYYY-MM-DD" format.
- "amount": Positive numeric float (e.g. 450.0).
- "type": "Expense" if it was a debit, withdrawal, transfer out, or payment; "Income" if it was a credit, deposit, refund, or salary.
- "category": One of: ["Food", "Housing", "Transport", "Utilities", "Leisure", "Health", "Shopping", "Salary", "Investment", "General"].
- "description": The raw narration / merchant description from the statement.
- "note": A concise, friendly summary note (e.g. "Swiggy food order", "Amazon purchase", "Fuel at petrol pump", "Salary credit").

Output MUST be a JSON object with this EXACT structure:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "amount": 100.0,
      "type": "Expense",
      "category": "Food",
      "description": "UPI/swiggy/123",
      "note": "Swiggy order"
    }
  ]
}
`;

        let contents: any[] = [];
        if (isPdf) {
          contents = [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: fileBase64,
                  },
                },
                {
                  text: 'Extract all transaction rows from this bank statement PDF into the requested JSON schema.',
                },
              ],
            },
          ];
        } else {
          // Text/CSV
          const textContent = Buffer.from(fileBase64, 'base64').toString('utf-8');
          contents = [
            {
              role: 'user',
              parts: [
                {
                  text: `Here is the bank statement content:\n\n${textContent}\n\nExtract all transactions into the requested JSON schema.`,
                },
              ],
            },
          ];
        }

        // Try gemini-2.5-flash first, fallback to gemini-1.5-flash
        const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
        let rawResponseText = '';

        for (const model of models) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
            const aiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents,
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.1,
                  maxOutputTokens: 8192,
                },
              }),
            });

            if (aiRes.ok) {
              const aiJson = await aiRes.json();
              rawResponseText = aiJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (rawResponseText) break;
            } else {
              console.warn(`[StatementParse] ${model} returned status ${aiRes.status}`);
            }
          } catch (modelErr) {
            console.warn(`[StatementParse] Error calling ${model}:`, modelErr);
          }
        }

        if (rawResponseText) {
          const parsed = JSON.parse(rawResponseText);
          const rawList = Array.isArray(parsed) ? parsed : (parsed.transactions || []);
          
          const transactions: ExtractedTransaction[] = rawList
            .filter((t: any) => t && t.date && !isNaN(Number(t.amount)) && Number(t.amount) > 0)
            .map((t: any) => ({
              date: t.date.toString().slice(0, 10),
              amount: parseFloat(t.amount) || 0,
              type: t.type === 'Income' ? 'Income' : 'Expense',
              category: t.category || 'General',
              description: t.description || 'Transaction',
              note: t.note || t.description || 'Transaction',
            }));

          return NextResponse.json({
            success: true,
            transactions,
            count: transactions.length,
            engine: 'gemini',
          });
        }
      } catch (geminiError) {
        console.error('[StatementParse] Gemini extraction failed:', geminiError);
      }
    }

    // 2. Fallback for CSV if Gemini unavailable or not PDF
    if (isCsv || !isPdf) {
      try {
        const textContent = Buffer.from(fileBase64, 'base64').toString('utf-8');
        const fallbackTransactions = parseCsvFallback(textContent);
        if (fallbackTransactions.length > 0) {
          return NextResponse.json({
            success: true,
            transactions: fallbackTransactions,
            count: fallbackTransactions.length,
            engine: 'rule-based-csv',
          });
        }
      } catch (csvErr) {
        console.error('[StatementParse] CSV fallback error:', csvErr);
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to extract transactions from the provided document. Please check the file format or ensure it contains readable text/statement tables.',
        transactions: [],
        count: 0,
      },
      { status: 422 }
    );
  } catch (error: any) {
    console.error('[StatementParse] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
