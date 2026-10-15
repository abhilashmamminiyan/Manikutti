import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ParsedVoiceExpense {
  amount: number;
  category: string;
  note: string;
  type: 'Expense' | 'Income' | 'Family';
  bankAccount: string;
  rawText: string;
  confidence: number;
}

const VALID_CATEGORIES = [
  'Food',
  'Housing',
  'Transport',
  'Leisure',
  'Health',
  'Shopping',
  'Investment',
  'Other',
];

/**
 * Intelligent rule-based parser for Manglish, Malayalam, and English
 * Used as immediate fallback if Gemini API is unreachable or rate-limited.
 */
function parseLocally(query: string, defaultBank: string = 'SBI'): ParsedVoiceExpense {
  const text = query.trim();
  const lower = text.toLowerCase();

  // Extract amount: numbers with optional decimals, preceded or followed by currency words
  let amount = 0;
  const numMatch = lower.match(/(?:₹|rs\.?|inr|roopa|rupa|roopakku|rupakku|രൂപ)?\s*(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|inr|roopa|rupa|roopakku|rupakku|രൂപ)?/i);
  if (numMatch && numMatch[1]) {
    amount = parseFloat(numMatch[1]);
  }

  // Detect Type
  let type: 'Expense' | 'Income' | 'Family' = 'Expense';
  if (
    lower.includes('family') ||
    lower.includes('കുടുംബം') ||
    lower.includes('veettil') ||
    lower.includes('വീട്ടിൽ') ||
    lower.includes('koottaayi')
  ) {
    type = 'Family';
  } else if (
    lower.includes('salary') ||
    lower.includes('income') ||
    lower.includes('kittiyathu') ||
    lower.includes('കിട്ടി') ||
    lower.includes('വരുമാനം') ||
    lower.includes('credited')
  ) {
    type = 'Income';
  }

  // Detect Category & Note
  let category = 'Other';
  let note = text;

  if (
    lower.includes('petrol') ||
    lower.includes('diesel') ||
    lower.includes('auto') ||
    lower.includes('taxi') ||
    lower.includes('bus') ||
    lower.includes('train') ||
    lower.includes('fuel') ||
    lower.includes('യാത്ര') ||
    lower.includes('പെട്രോൾ')
  ) {
    category = 'Transport';
    note = lower.includes('petrol') || lower.includes('പെട്രോൾ') ? 'Petrol' : 'Travel / Transport';
  } else if (
    lower.includes('chaya') ||
    lower.includes('tea') ||
    lower.includes('coffee') ||
    lower.includes('kadi') ||
    lower.includes('snack') ||
    lower.includes('food') ||
    lower.includes('meals') ||
    lower.includes('lunch') ||
    lower.includes('dinner') ||
    lower.includes('meen') ||
    lower.includes('fish') ||
    lower.includes('pachakkari') ||
    lower.includes('vegetable') ||
    lower.includes('swiggy') ||
    lower.includes('zomato') ||
    lower.includes('hotel') ||
    lower.includes('ഭക്ഷണം') ||
    lower.includes('ചായ')
  ) {
    category = 'Food';
    if (lower.includes('chaya') || lower.includes('tea')) note = 'Tea & Snacks';
    else if (lower.includes('meen') || lower.includes('fish')) note = 'Fish purchase';
    else if (lower.includes('pachakkari') || lower.includes('vegetable')) note = 'Vegetables';
    else note = 'Food & Dining';
  } else if (
    lower.includes('wifi') ||
    lower.includes('recharge') ||
    lower.includes('current') ||
    lower.includes('kseb') ||
    lower.includes('electricity') ||
    lower.includes('water') ||
    lower.includes('rent') ||
    lower.includes('വാടക') ||
    lower.includes('കറണ്ട്')
  ) {
    category = 'Housing';
    if (lower.includes('wifi')) note = 'Wi-Fi Recharge';
    else if (lower.includes('kseb') || lower.includes('current')) note = 'Electricity (KSEB)';
    else if (lower.includes('recharge')) note = 'Mobile Recharge';
    else note = 'House & Utilities';
  } else if (
    lower.includes('movie') ||
    lower.includes('cinema') ||
    lower.includes('theatre') ||
    lower.includes('film') ||
    lower.includes('hotstar') ||
    lower.includes('netflix') ||
    lower.includes('സിനിമ')
  ) {
    category = 'Leisure';
    note = 'Movie & Entertainment';
  } else if (
    lower.includes('medicine') ||
    lower.includes('hospital') ||
    lower.includes('doctor') ||
    lower.includes('clinic') ||
    lower.includes('ഗുളിക') ||
    lower.includes('മരുന്ന്')
  ) {
    category = 'Health';
    note = 'Medical & Pharmacy';
  } else if (
    lower.includes('dress') ||
    lower.includes('clothes') ||
    lower.includes('shopping') ||
    lower.includes('amazon') ||
    lower.includes('flipkart')
  ) {
    category = 'Shopping';
    note = 'Shopping';
  }

  // Detect bank
  let bankAccount = defaultBank;
  if (lower.includes('canara') || lower.includes('കാനറ')) {
    bankAccount = 'Canara Bank';
  } else if (lower.includes('sbi') || lower.includes('എസ്.ബി.ഐ')) {
    bankAccount = 'SBI';
  }

  return {
    amount,
    category,
    note,
    type,
    bankAccount,
    rawText: text,
    confidence: amount > 0 ? 0.75 : 0.4,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = (body.query || body.transcript || '').trim();
    const defaultBank = body.defaultBank || 'SBI';

    if (!query) {
      return NextResponse.json(
        { error: 'Voice input transcript is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fall back to intelligent local parser
      const localResult = parseLocally(query, defaultBank);
      return NextResponse.json({
        success: true,
        source: 'local-regex-fallback',
        data: localResult,
      });
    }

    // Call Gemini 2.5 Flash / 1.5 Flash
    const systemPrompt = `
You are the Manikutti Voice Expense Parser.
Your task is to take a natural spoken voice transcript in English, Malayalam, or Manglish (Malayalam written in English alphabet) and extract structured finance information.

Input transcript examples:
- "100 roopakku petrol adichu" -> amount: 100, category: "Transport", note: "Petrol", type: "Expense"
- "100 roopakku petrol adichu ith manikuttiyil save cheyyu" -> amount: 100, category: "Transport", note: "Petrol", type: "Expense"
- "chayakkum kadikkum 45 roopa" -> amount: 45, category: "Food", note: "Tea and Snacks", type: "Expense"
- "meen vaangan 350 roopa" -> amount: 350, category: "Food", note: "Fish", type: "Expense"
- "wifi bill 999 paid" -> amount: 999, category: "Housing", note: "Wi-Fi Bill", type: "Expense"
- "kudumbathilekku 1500 roopa groceries" -> amount: 1500, category: "Food", note: "Groceries", type: "Family"
- "salary 45000 kittiyathu sbi il" -> amount: 45000, category: "Investment", note: "Salary", type: "Income", bankAccount: "SBI"

Allowed categories MUST be one of:
["Food", "Housing", "Transport", "Leisure", "Health", "Shopping", "Investment", "Other"]

Allowed types MUST be one of:
["Expense", "Income", "Family"]

Allowed bankAccount MUST be one of:
["SBI", "Canara Bank"] (default to "${defaultBank}" if not specified)

Return ONLY a pure JSON object with these exact keys:
{
  "amount": number,
  "category": string,
  "note": string,
  "type": "Expense" | "Income" | "Family",
  "bankAccount": "SBI" | "Canara Bank"
}
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const aiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [{ text: `Extract expense details from this transcript:\n"${query}"` }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!aiRes.ok) {
      console.warn('Gemini API call failed, using rule-based parser:', await aiRes.text());
      const localResult = parseLocally(query, defaultBank);
      return NextResponse.json({
        success: true,
        source: 'local-regex-fallback',
        data: localResult,
      });
    }

    const aiJson = await aiRes.json();
    const rawAiOutput = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawAiOutput) {
      const localResult = parseLocally(query, defaultBank);
      return NextResponse.json({
        success: true,
        source: 'local-regex-fallback',
        data: localResult,
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawAiOutput);
    } catch (_) {
      // Clean possible markdown code fences
      const cleaned = rawAiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    // Validate category
    let finalCategory = parsed.category || 'Other';
    if (!VALID_CATEGORIES.includes(finalCategory)) {
      finalCategory = 'Other';
    }

    // Validate type
    let finalType: 'Expense' | 'Income' | 'Family' = 'Expense';
    if (['Expense', 'Income', 'Family'].includes(parsed.type)) {
      finalType = parsed.type;
    }

    const finalResult: ParsedVoiceExpense = {
      amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0,
      category: finalCategory,
      note: parsed.note || query,
      type: finalType,
      bankAccount: parsed.bankAccount === 'Canara Bank' ? 'Canara Bank' : 'SBI',
      rawText: query,
      confidence: 0.95,
    };

    return NextResponse.json({
      success: true,
      source: 'gemini-ai',
      data: finalResult,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/voice-expense:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing voice expense' },
      { status: 500 }
    );
  }
}
