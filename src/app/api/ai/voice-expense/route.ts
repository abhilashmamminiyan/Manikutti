import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ParsedVoiceExpense {
  action: 'create' | 'delete';
  count?: number;
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

  // 1. Detect Delete / Undo Intent
  const isDeleteKeyword =
    lower.includes('delete') ||
    lower.includes('remove') ||
    lower.includes('undo') ||
    lower.includes('cancel') ||
    lower.includes('clear') ||
    lower.includes('ഡിലീറ്റ്') ||
    lower.includes('കളയുക') ||
    lower.includes('ഒഴിവാക്കുക') ||
    lower.includes('മാറ്റുക');

  const hasDeleteTarget =
    lower.includes('transaction') ||
    lower.includes('transactions') ||
    lower.includes('expense') ||
    lower.includes('expenses') ||
    lower.includes('record') ||
    lower.includes('entry') ||
    lower.includes('entries') ||
    lower.includes('last') ||
    lower.includes('recent') ||
    lower.includes('avasaana') ||
    lower.includes('avasaanathe') ||
    lower.includes('kazhinja') ||
    lower.includes('ഇടപാട്') ||
    lower.includes('അവസാന');

  if (isDeleteKeyword && hasDeleteTarget) {
    let count = 1;
    if (lower.match(/\b(two|randu|rendu|രണ്ട്)\b/i) || lower.match(/\b2\b/)) {
      count = 2;
    } else if (lower.match(/\b(three|moonnu|മൂന്ന്)\b/i) || lower.match(/\b3\b/)) {
      count = 3;
    } else if (lower.match(/\b(four|naalu|നാല്)\b/i) || lower.match(/\b4\b/)) {
      count = 4;
    } else if (lower.match(/\b(five|anchu|അഞ്ച്)\b/i) || lower.match(/\b5\b/)) {
      count = 5;
    } else {
      const digitMatch = lower.match(/\b(\d+)\b/);
      if (digitMatch && digitMatch[1]) {
        count = parseInt(digitMatch[1], 10) || 1;
      }
    }
    if (count > 10) count = 10;

    return {
      action: 'delete',
      count,
      amount: 0,
      category: 'Other',
      note: text,
      type: 'Expense',
      bankAccount: defaultBank,
      rawText: text,
      confidence: 0.95,
    };
  }

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
    lower.includes('credited') ||
    lower.includes('thannu') ||
    lower.includes('thanu') ||
    lower.includes('thannathu') ||
    lower.includes('തന്നു') ||
    lower.includes('തന്നത്') ||
    lower.includes('കിട്ടിയത്') ||
    lower.includes('ലഭിച്ചു') ||
    lower.includes('ലഭിച്ച') ||
    lower.includes('വരവ്') ||
    lower.includes('received') ||
    lower.includes('got') ||
    lower.includes('cashback') ||
    lower.includes('refund') ||
    lower.includes('repaid') ||
    lower.includes('returned') ||
    lower.includes('deposit')
  ) {
    type = 'Income';
  }

  // Detect Category & Note
  let category = 'Other';
  let note = text;

  if (type === 'Income') {
    if (lower.includes('salary') || lower.includes('ശമ്പളം')) {
      category = 'Investment';
      note = 'Salary';
    } else if (lower.includes('cashback') || lower.includes('refund')) {
      category = 'Other';
      note = 'Cashback / Refund';
    } else {
      category = 'Other';
      const nameMatch = text.trim().match(/^([a-zA-Z]+)\s+.*(?:thannu|thanu|thannathu|തന്നു)/i);
      if (nameMatch && nameMatch[1]) {
        note = `Received from ${nameMatch[1]}`;
      } else {
        note = text;
      }
    }
  } else if (
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
    action: 'create',
    amount,
    category,
    note,
    type,
    bankAccount,
    rawText: text,
    confidence: amount > 0 ? 0.75 : 0.2,
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
You are the Manikutti Voice Expense & Command Parser.
Your task is to take a natural spoken voice transcript in English, Malayalam, or Manglish (Malayalam written in English alphabet) and extract structured finance information or commands.

1. ACTION INTENTS:
- "create": When the user is logging an expense, purchase, or income.
- "delete": When the user asks to delete, remove, undo, or cancel recent/last transactions (e.g., "delete last 2 transactions", "undo last expense", "avasaana transaction delete aakku", "avasaanathe 2 transaction remove cheyyu", "അവസാനത്തെ രണ്ട് ട്രാൻസാക്ഷൻ ഒഴിവാക്കുക", "കഴിഞ്ഞ ട്രാൻസാക്ഷൻ ഡിലീറ്റ് ചെയ്യ്").

2. EXAMPLES FOR "delete" INTENTS:
- "delete last 2 transactions" -> action: "delete", count: 2, note: "Delete last 2 transactions"
- "delete last transaction" -> action: "delete", count: 1, note: "Delete last transaction"
- "undo last expense" -> action: "delete", count: 1, note: "Undo last expense"
- "avasaana randu transaction delete cheyyu" -> action: "delete", count: 2, note: "Delete last 2 transactions"
- "kazhinja transaction kalayuka" -> action: "delete", count: 1, note: "Delete last transaction"
- "അവസാന ട്രാൻസാക്ഷൻ ഒഴിവാക്കുക" -> action: "delete", count: 1, note: "Delete last transaction"

3. EXAMPLES FOR "create" INTENTS:
- "100 roopakku petrol adichu" -> action: "create", amount: 100, category: "Transport", note: "Petrol", type: "Expense"
- "100 roopakku petrol adichu ith manikuttiyil save cheyyu" -> action: "create", amount: 100, category: "Transport", note: "Petrol", type: "Expense"
- "chayakkum kadikkum 45 roopa" -> action: "create", amount: 45, category: "Food", note: "Tea and Snacks", type: "Expense"
- "meen vaangan 350 roopa" -> action: "create", amount: 350, category: "Food", note: "Fish", type: "Expense"
- "wifi bill 999 paid" -> action: "create", amount: 999, category: "Housing", note: "Wi-Fi Bill", type: "Expense"
- "kudumbathilekku 1500 roopa groceries" -> action: "create", amount: 1500, category: "Food", note: "Groceries", type: "Family"

4. CRITICAL INCOME RULES & EXAMPLES (type MUST be "Income"):
- "ajesh enikku 100 rs thannu" -> action: "create", amount: 100, category: "Other", note: "Received from Ajesh", type: "Income"
- "ajesh 500 roopa thannu" -> action: "create", amount: 500, category: "Other", note: "From Ajesh", type: "Income"
- "friend 200 thirichu thannu" -> action: "create", amount: 200, category: "Other", note: "Repaid from friend", type: "Income"
- "salary 45000 kittiyathu sbi il" -> action: "create", amount: 45000, category: "Investment", note: "Salary", type: "Income", bankAccount: "SBI"
- "google pay cashback 25 roopa" -> action: "create", amount: 25, category: "Other", note: "Cashback", type: "Income"
- "enikku 1000 roopa labhichu" -> action: "create", amount: 1000, category: "Other", note: "Received 1000", type: "Income"
- "അജേഷ് എനിക്ക് 100 രൂപ തന്നു" -> action: "create", amount: 100, category: "Other", note: "From Ajesh", type: "Income"

IMPORTANT TYPE CLASSIFICATION RULES:
- "Income": Whenever money is GIVEN TO the user or RECEIVED (Malayalam: "thannu", "thannathu", "thanu", "enikku thannu", "kittiyathu", "kitti", "labhichu", "തന്നു", "കിട്ടി", English: "gave me", "received", "credited", "repaid", "cashback", "refund"), the type MUST BE "Income", NOT "Expense"!
- "Expense": Whenever money is SPENT or PAID BY the user (Malayalam: "koduthu", "vaangi", "adichu", "paid", "spent"), type MUST BE "Expense".
- "Family": Whenever expenses are for family or household pool ("kudumbam", "veettil").

Allowed categories MUST be one of:
["Food", "Housing", "Transport", "Leisure", "Health", "Shopping", "Investment", "Other"]

Allowed types MUST be one of:
["Expense", "Income", "Family"]

Allowed bankAccount MUST be one of:
["SBI", "Canara Bank"] (default to "${defaultBank}" if not specified)

Return ONLY a pure JSON object with these exact keys:
{
  "action": "create" | "delete",
  "count": number,
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
            parts: [{ text: `Extract action or expense details from this transcript:\n"${query}"` }],
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

    const action = parsed.action === 'delete' ? 'delete' : 'create';
    let count: number | undefined;
    if (action === 'delete') {
      const parsedCount = typeof parsed.count === 'number' ? parsed.count : parseInt(parsed.count, 10);
      count = Math.min(Math.max(1, parsedCount || 1), 10);
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

    const amount = typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0;

    const finalResult: ParsedVoiceExpense = {
      action,
      count,
      amount: action === 'delete' ? 0 : amount,
      category: finalCategory,
      note: parsed.note || query,
      type: finalType,
      bankAccount: parsed.bankAccount === 'Canara Bank' ? 'Canara Bank' : 'SBI',
      rawText: query,
      confidence: action === 'delete' ? 0.95 : (amount > 0 ? 0.95 : 0.2),
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
