import { NextResponse } from 'next/server';
import { getAuthUserEmail } from '@/lib/authHelper';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getFamilyRolesConfig, resolveEffectivePermissions } from '@/lib/featurePermissions';

export interface ExtractedScreenshotResult {
  amount: number;
  category: string;
  merchant: string;
  note: string;
  type: 'Expense' | 'Income';
  bankAccount: string;
  date: string;
  confidence: number;
}

const VALID_CATEGORIES = ['Food', 'Housing', 'Transport', 'Bills', 'Shopping', 'Health', 'Leisure', 'Investment', 'Salary', 'Loan/EMI', 'Other'];

const MERCHANT_CATEGORY_RULES: Array<{ keywords: RegExp; category: string }> = [
  { keywords: /\b(swiggy|zomato|kfc|mcdonald|domino|pizza|Tea|coffee|chai|cafe|hotel|restaurant|biryani|bakery|eatfit|blinkit|zepto|instamart|bigbasket|dmart|supermarket|grocery|vegetables|milk|fruits|meat|fish)\b/i, category: 'Food' },
  { keywords: /\b(uber|ola|rapido|irctc|metro|redbus|petrol|diesel|fuel|hpcl|bpcl|iocl|indian oil|fastag|toll|parking|auto)\b/i, category: 'Transport' },
  { keywords: /\b(kseb|bescom|tneb|electricity|water|gas|indane|hp gas|bharatgas|jio|airtel|vi\b|bsnl|broadband|wifi|recharge|bill|dth|tataplay|postpaid)\b/i, category: 'Bills' },
  { keywords: /\b(amazon|flipkart|myntra|ajio|nykaa|meesho|reliance|croma|mall|fashion|decathlon|ikea)\b/i, category: 'Shopping' },
  { keywords: /\b(pharmacy|apollo|medplus|1mg|pharmeasy|hospital|clinic|doctor|lab|scan|dental|medical|health)\b/i, category: 'Health' },
  { keywords: /\b(netflix|prime|hotstar|spotify|youtube|bookmyshow|pvr|inox|cinema|movie|game)\b/i, category: 'Leisure' },
  { keywords: /\b(rent|maintenance|housing|house|broker|plumber|electrician|carpenter)\b/i, category: 'Housing' },
  { keywords: /\b(sip|mutual fund|zerodha|groww|upstox|lic|insurance|ppf|nps|rd|fd)\b/i, category: 'Investment' },
  { keywords: /\b(emi|loan|bajaj|hdfc bank loan|home loan|muthoot|manappuram)\b/i, category: 'Loan/EMI' },
];

export function extractTransactionLocally(ocrText: string): ExtractedScreenshotResult {
  const text = (ocrText || '').replace(/\r/g, '\n');
  const lower = text.toLowerCase();

  // Amount parsing: prioritize currency symbols or "Paid to" amounts
  let amount = 0;
  const amountPatterns = [
    /(?:₹|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi,
    /(?:paid|amount|sent|debited|credited|total)\s*(?::|-)?\s*(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi,
  ];

  const candidates: number[] = [];
  for (const regex of amountPatterns) {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (!Number.isNaN(val) && val > 0 && val < 10000000) {
        candidates.push(val);
      }
    }
  }
  if (candidates.length > 0) {
    amount = candidates[0];
  } else {
    // Fallback standalone decimal / integer line (typical large bold GPay/PhonePe number)
    const lines = text.split('\n').map((l) => l.trim());
    for (const line of lines) {
      if (/^[0-9][0-9,]*(?:\.[0-9]{1,2})?$/.test(line)) {
        const val = parseFloat(line.replace(/,/g, ''));
        // Exclude likely timestamps/phone numbers/UPI pin lengths > 7 digits
        if (!Number.isNaN(val) && val >= 1 && val < 500000) {
          amount = val;
          break;
        }
      }
    }
  }

  // Merchant extraction
  let merchant = '';
  const paidToMatch = text.match(/(?:paid to|to|transfer to|received from|from|merchant)\s*[:\-]?\s*([a-z0-9 &._'-]{2,40})/i);
  if (paidToMatch && paidToMatch[1]) {
    merchant = paidToMatch[1].trim().split('\n')[0].trim();
  }

  // Income vs Expense detection
  const isIncome =
    /\b(received from|credited to|credit alert|cashback|refunded|you received|salary credited)\b/i.test(lower) &&
    !/\b(paid to|sent to|debited|you paid)\b/i.test(lower);
  const type: 'Expense' | 'Income' = isIncome ? 'Income' : 'Expense';

  // Category detection
  let category = isIncome ? 'Salary' : 'Other';
  for (const rule of MERCHANT_CATEGORY_RULES) {
    if (rule.keywords.test(text)) {
      category = rule.category;
      break;
    }
  }

  // Bank / Payment app detection
  let bankAccount = 'UPI';
  if (/\bsbi\b|state bank/i.test(text)) bankAccount = 'SBI';
  else if (/\bhdfc\b/i.test(text)) bankAccount = 'HDFC';
  else if (/\bicici\b/i.test(text)) bankAccount = 'ICICI';
  else if (/\bfederal\b/i.test(text)) bankAccount = 'Federal';
  else if (/\bcanara\b/i.test(text)) bankAccount = 'Canara';
  else if (/\baxis\b/i.test(text)) bankAccount = 'Axis';
  else if (/\bgpay\b|google pay/i.test(text)) bankAccount = 'GPay';
  else if (/\bphonepe\b/i.test(text)) bankAccount = 'PhonePe';
  else if (/\bpaytm\b/i.test(text)) bankAccount = 'Paytm';

  const note = merchant ? `${merchant} (Screenshot)` : 'Screenshot Payment';
  const confidence = amount > 0 ? (merchant ? 0.72 : 0.55) : 0.2;

  return {
    amount,
    category,
    merchant,
    note,
    type,
    bankAccount,
    date: new Date().toISOString(),
    confidence,
  };
}

function normalizeAiOutput(rawJson: Record<string, unknown>, fallback: ExtractedScreenshotResult): ExtractedScreenshotResult {
  const amtNum = typeof rawJson.amount === 'number' ? rawJson.amount : parseFloat(String(rawJson.amount || '0'));
  const rawCat = String(rawJson.category || '').trim();
  const matchedCat =
    VALID_CATEGORIES.find((c) => c.toLowerCase() === rawCat.toLowerCase()) ||
    fallback.category;

  const merchant = String(rawJson.merchant || fallback.merchant || '').trim().slice(0, 60);
  const rawNote = String(rawJson.note || '').trim().slice(0, 120);
  const note = rawNote || (merchant ? `${merchant}` : fallback.note);
  const type = String(rawJson.type || '').toLowerCase() === 'income' ? 'Income' : 'Expense';
  const bankAccount = String(rawJson.bankAccount || fallback.bankAccount || 'UPI').trim().slice(0, 30);
  const confidenceRaw = typeof rawJson.confidence === 'number' ? rawJson.confidence : 0.85;

  return {
    amount: !Number.isNaN(amtNum) && amtNum > 0 ? amtNum : fallback.amount,
    category: matchedCat,
    merchant,
    note,
    type,
    bankAccount,
    date: new Date().toISOString(),
    confidence: Math.min(1, Math.max(0, confidenceRaw)),
  };
}

async function callGeminiModel(
  model: string,
  apiKey: string,
  parts: Array<Record<string, unknown>>
): Promise<Record<string, unknown> | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.warn(`[AI Extract] Gemini ${model} HTTP ${res.status}: ${errText.slice(0, 200)}`);
    return null;
  }

  const data = await res.json();
  const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOut || typeof textOut !== 'string') return null;

  try {
    const cleaned = textOut.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const ocrText = typeof body?.ocrText === 'string' ? body.ocrText.slice(0, 4000) : '';
    const imageBase64 = typeof body?.imageBase64 === 'string' ? body.imageBase64 : '';
    const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : 'image/jpeg';

    const localFallback = extractTransactionLocally(ocrText);

    // Check Admin AI toggle + role permission
    let aiEnabled = true;
    try {
      const service = new GoogleSheetsService(email);
      const familySheetId = await service.findOrCreateSheet('Family');
      if (familySheetId) {
        const members = await service.getSheetData(familySheetId, 'Family_Members!A:C');
        const userRow = members.slice(1).find((r) => r[1]?.toString().trim().toLowerCase() === email.toLowerCase());
        if (userRow) {
          const familyCode = userRow[0]?.toString().trim() || '';
          const roleName = userRow[2]?.toString().trim() || 'Member';
          const config = await getFamilyRolesConfig(service, familySheetId, familyCode);
          const effective = resolveEffectivePermissions(config, roleName);
          aiEnabled = effective.ai_screenshot_extraction;
        }
      }
    } catch (err) {
      console.warn('[AI Extract] Role permission lookup skipped, using fallback:', err);
    }

    if (!aiEnabled) {
      return NextResponse.json({
        success: true,
        aiEnabled: false,
        source: 'local_disabled_by_admin',
        extracted: localFallback,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        aiEnabled: true,
        source: 'local_missing_api_key',
        extracted: localFallback,
      });
    }

    const instructionPrompt = `Extract Indian UPI/bank payment screenshot details into JSON with exact keys:
{"amount": number, "category": one of [${VALID_CATEGORIES.map((c) => `"${c}"`).join(', ')}], "merchant": string, "note": short description string, "type": "Expense" or "Income", "bankAccount": bank or app name e.g. "SBI"|"HDFC"|"ICICI"|"GPay"|"PhonePe"|"UPI", "confidence": number 0..1}.
Ignore transaction IDs, UTR numbers, reference codes, and phone numbers when extracting "amount".`;

    // Stage 2A: OCR text-first (tiny token footprint for free tier)
    if (ocrText.trim().length >= 12) {
      const textParts = [
        {
          text: `${instructionPrompt}\n\nOCR TEXT:\n${ocrText}`,
        },
      ];
      let aiRaw = await callGeminiModel('gemini-2.5-flash-lite', apiKey, textParts);
      if (!aiRaw) {
        aiRaw = await callGeminiModel('gemini-2.5-flash', apiKey, textParts);
      }
      if (aiRaw) {
        const normalized = normalizeAiOutput(aiRaw, localFallback);
        if (normalized.amount > 0 && (normalized.confidence >= 0.5 || !imageBase64)) {
          return NextResponse.json({
            success: true,
            aiEnabled: true,
            source: 'gemini_text',
            extracted: normalized,
          });
        }
      }
    }

    // Stage 2B: Compressed Vision fallback only if OCR was insufficient
    if (imageBase64 && imageBase64.length > 50) {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',').pop() || imageBase64 : imageBase64;
      const visionParts: Array<Record<string, unknown>> = [
        { text: instructionPrompt },
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
      ];
      let visionRaw = await callGeminiModel('gemini-2.5-flash-lite', apiKey, visionParts);
      if (!visionRaw) {
        visionRaw = await callGeminiModel('gemini-2.5-flash', apiKey, visionParts);
      }
      if (visionRaw) {
        const normalized = normalizeAiOutput(visionRaw, localFallback);
        return NextResponse.json({
          success: true,
          aiEnabled: true,
          source: 'gemini_vision',
          extracted: normalized,
        });
      }
    }

    return NextResponse.json({
      success: true,
      aiEnabled: true,
      source: 'local_fallback',
      extracted: localFallback,
    });
  } catch (error: unknown) {
    console.error('[AI Extract] Error:', error);
    return NextResponse.json(
      { error: 'Extraction failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
