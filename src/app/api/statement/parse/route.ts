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

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

/**
 * Intelligent regex/column parser for Indian Bank statements (SBI, HDFC, ICICI, Canara, Axis, Federal)
 * Supports standard table layouts like:
 * [Date] [Value Date] [Description / Narration] [Ref / Chq] [Debit] [Credit] [Balance]
 */
function parseIndianBankStatementText(rawText: string): ExtractedTransaction[] {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results: ExtractedTransaction[] = [];

  // Match dates: "01 Oct 2026", "1-Oct-2026", "01/10/2026", "01-10-2026", "2026-10-01"
  const dateRegex = /^(\d{1,2})[\s/-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s/-]+(\d{2,4})|^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(dateRegex);
    if (!match) continue;

    let parsedDate = '';
    let remainder = '';

    if (match[1] && match[2] && match[3]) {
      const day = match[1].padStart(2, '0');
      const month = MONTHS[match[2].toLowerCase().slice(0, 3)] || '01';
      let year = match[3];
      if (year.length === 2) year = '20' + year;
      parsedDate = `${year}-${month}-${day}`;
      remainder = line.slice(match[0].length).trim();
    } else if (match[4] && match[5] && match[6]) {
      const p1 = match[4];
      const p2 = match[5].padStart(2, '0');
      const p3 = match[6];
      if (p1.length === 4) {
        parsedDate = `${p1}-${p2}-${p3.padStart(2, '0')}`;
      } else {
        const year = p3.length === 2 ? '20' + p3 : p3;
        parsedDate = `${year}-${p2}-${p1.padStart(2, '0')}`;
      }
      remainder = line.slice(match[0].length).trim();
    }

    if (!parsedDate) continue;

    // Optional second date (Value date often immediately follows Txn date in SBI/HDFC)
    const secondDateMatch = remainder.match(dateRegex);
    if (secondDateMatch) {
      remainder = remainder.slice(secondDateMatch[0].length).trim();
    }

    // Extract trailing currency amounts (Debit, Credit, Balance)
    const tokens = remainder.split(/\s+/);
    const amountTokens: number[] = [];
    const descTokens = [...tokens];

    while (descTokens.length > 0) {
      const last = descTokens[descTokens.length - 1].replace(/,/g, '');
      const num = parseFloat(last);
      // Valid currency amount token e.g. 450.00 or 12345.67
      if (!isNaN(num) && /^\d+(?:\.\d{1,2})?$/.test(last)) {
        amountTokens.unshift(num);
        descTokens.pop();
      } else {
        break;
      }
    }

    if (amountTokens.length === 0) continue;

    const description = descTokens.join(' ').trim() || 'Bank Transaction';
    let amount = 0;
    let type: 'Expense' | 'Income' = 'Expense';

    const lowerDesc = description.toLowerCase();
    const isCredit =
      lowerDesc.includes(' cr') ||
      lowerDesc.includes('credit') ||
      lowerDesc.includes('salary') ||
      lowerDesc.includes('by transfer') ||
      lowerDesc.includes('refund') ||
      lowerDesc.includes('interest') ||
      lowerDesc.includes('dividend');

    if (amountTokens.length >= 2) {
      // Last token is running balance, previous token is transaction amount
      amount = amountTokens[amountTokens.length - 2];
    } else {
      amount = amountTokens[0];
    }

    if (amount <= 0) continue;
    type = isCredit ? 'Income' : 'Expense';

    // Intelligent category classification
    let category = 'General';
    if (lowerDesc.includes('swiggy') || lowerDesc.includes('zomato') || lowerDesc.includes('hotel') || lowerDesc.includes('food') || lowerDesc.includes('restaurant') || lowerDesc.includes('cafe')) category = 'Food';
    else if (lowerDesc.includes('fuel') || lowerDesc.includes('petrol') || lowerDesc.includes('hpcl') || lowerDesc.includes('bpcl') || lowerDesc.includes('ioc') || lowerDesc.includes('uber') || lowerDesc.includes('ola')) category = 'Transport';
    else if (lowerDesc.includes('amazon') || lowerDesc.includes('flipkart') || lowerDesc.includes('myntra') || lowerDesc.includes('retail') || lowerDesc.includes('mart') || lowerDesc.includes('pos ')) category = 'Shopping';
    else if (lowerDesc.includes('salary') || lowerDesc.includes('payroll')) { category = 'Salary'; type = 'Income'; }
    else if (lowerDesc.includes('electric') || lowerDesc.includes('kseb') || lowerDesc.includes('bescom') || lowerDesc.includes('airtel') || lowerDesc.includes('jio') || lowerDesc.includes('vi ') || lowerDesc.includes('broadband')) category = 'Utilities';
    else if (lowerDesc.includes('rent') || lowerDesc.includes('housing') || lowerDesc.includes('society')) category = 'Housing';
    else if (lowerDesc.includes('pharmacy') || lowerDesc.includes('hospital') || lowerDesc.includes('med') || lowerDesc.includes('clinic')) category = 'Health';
    else if (lowerDesc.includes('cinema') || lowerDesc.includes('movie') || lowerDesc.includes('theatre') || lowerDesc.includes('netflix') || lowerDesc.includes('hotstar') || lowerDesc.includes('prime')) category = 'Leisure';
    else if (lowerDesc.includes('zerodha') || lowerDesc.includes('groww') || lowerDesc.includes('mutual') || lowerDesc.includes('sip') || lowerDesc.includes('mf ')) category = 'Investment';

    results.push({
      date: parsedDate,
      amount,
      type,
      category,
      description,
      note: description.slice(0, 60),
    });
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
    const { fileBase64, fileName, mimeType, textContent: directText } = body;

    if (!fileBase64 && !directText) {
      return NextResponse.json({ error: 'Missing fileBase64 or textContent in request' }, { status: 400 });
    }

    const isPdf = (!directText) && ((mimeType && mimeType.includes('pdf')) || (fileName && fileName.toLowerCase().endsWith('.pdf')));
    const isCsv = (mimeType && (mimeType.includes('csv') || mimeType.includes('text'))) || (fileName && fileName.toLowerCase().endsWith('.csv'));

    // Effective raw text (either directly extracted on client or from base64)
    let extractedRawText = directText || '';
    if (!extractedRawText && fileBase64 && !isPdf) {
      extractedRawText = Buffer.from(fileBase64, 'base64').toString('utf-8');
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API Key is available, use multimodal / text Gemini Flash
    if (apiKey) {
      try {
        const systemInstruction = `
You are an expert banking and financial data extractor for the Manikutti Hub.
Extract ALL individual financial transactions from this bank statement.

For every transaction row found:
- "date": Date normalized to "YYYY-MM-DD" format.
- "amount": Positive numeric float (e.g. 450.0).
- "type": "Expense" if it was a debit, withdrawal, payment, or transfer out; "Income" if it was a credit, deposit, salary, or refund.
- "category": One of: ["Food", "Housing", "Transport", "Utilities", "Leisure", "Health", "Shopping", "Salary", "Investment", "General"].
- "description": The full narration or merchant description from the statement.
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
        if (extractedRawText) {
          contents = [
            {
              role: 'user',
              parts: [
                {
                  text: `Here is the bank statement content:\n\n${extractedRawText}\n\nExtract all transactions into the requested JSON schema.`,
                },
              ],
            },
          ];
        } else if (fileBase64 && isPdf) {
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
        }

        // Try gemini-2.0-flash first, fallback to gemini-1.5-flash
        const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
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
              const errBody = await aiRes.text();
              console.warn(`[StatementParse] ${model} returned status ${aiRes.status}:`, errBody);
              if (errBody.toLowerCase().includes('password') || errBody.toLowerCase().includes('encrypted')) {
                return NextResponse.json(
                  {
                    error: 'PASSWORD_PROTECTED',
                    isPasswordProtected: true,
                    message: 'The PDF is password protected. Please unlock it with your statement password.',
                  },
                  { status: 422 }
                );
              }
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

          if (transactions.length > 0) {
            return NextResponse.json({
              success: true,
              transactions,
              count: transactions.length,
              engine: 'gemini',
            });
          }
        }
      } catch (geminiError) {
        console.error('[StatementParse] Gemini extraction failed:', geminiError);
      }
    }

    // 2. Intelligent Rule-based fallback if Gemini failed or is unavailable
    if (extractedRawText) {
      try {
        // Try Indian bank statement table parsing first (SBI, HDFC, ICICI, etc.)
        const statementTransactions = parseIndianBankStatementText(extractedRawText);
        if (statementTransactions.length > 0) {
          return NextResponse.json({
            success: true,
            transactions: statementTransactions,
            count: statementTransactions.length,
            engine: 'rule-based-statement',
          });
        }

        // Try standard CSV parsing
        const csvTransactions = parseCsvFallback(extractedRawText);
        if (csvTransactions.length > 0) {
          return NextResponse.json({
            success: true,
            transactions: csvTransactions,
            count: csvTransactions.length,
            engine: 'rule-based-csv',
          });
        }
      } catch (fallbackErr) {
        console.error('[StatementParse] Local text parsing fallback error:', fallbackErr);
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
