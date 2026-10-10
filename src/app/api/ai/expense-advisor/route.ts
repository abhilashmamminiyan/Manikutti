import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CachedAdvice {
  timestamp: number;
  advice: string;
  totalExpenses: number;
  topCategories: { category: string; amount: number }[];
  categoryBreakdown: Record<string, number>;
  engine: 'gemini' | 'rule-based';
}

// 15-minute in-memory cache to stay well within Gemini's Free Tier limits
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MIN_COOLDOWN_MS = 60 * 1000; // 1 minute minimum cooldown between fresh API calls
const adviceCache = new Map<string, CachedAdvice>();

/**
 * Intelligent rule-based Malayalam advisor fallback.
 * Generates culturally contextual, personalized financial advice and savings tips
 * even when Gemini API key is missing, rate-limited, or temporarily offline.
 */
function generateIntelligentMalayalamAdvice(params: {
  totalExpense: number;
  sortedCategories: { category: string; amount: number }[];
  entertainmentExpenses: { note: string; amount: number }[];
  foodExpenses: { note: string; amount: number }[];
}): string {
  const { totalExpense, sortedCategories, entertainmentExpenses, foodExpenses } = params;

  const entTotal = entertainmentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const foodTotal = foodExpenses.reduce((sum, e) => sum + e.amount, 0);

  const sections: string[] = [];

  // 1. Total Spending Overview
  let assessment = `📊 മൊത്തം ചിലവ് വിലയിരുത്തൽ:\nഈ കാലയളവിലെ നിങ്ങളുടെ ആകെ ചിലവ് ₹${totalExpense.toLocaleString('en-IN')} ആണ്.`;
  if (sortedCategories.length > 0) {
    const topCat = sortedCategories[0];
    const pct = totalExpense > 0 ? Math.round((topCat.amount / totalExpense) * 100) : 0;
    assessment += ` ഇതിൽ ഏറ്റവും കൂടുതൽ തുക ചിലവഴിച്ചിരിക്കുന്നത് '${topCat.category}' വിഭാഗത്തിലാണ് (₹${topCat.amount.toLocaleString('en-IN')}, ആകെ ചിലവിന്റെ ${pct}%).`;
  }
  sections.push(assessment);

  // 2. Entertainment & OTT Subscriptions (Hotstar, Netflix, Prime, Theater)
  if (entTotal > 0 || entertainmentExpenses.length > 0) {
    let entText = `🎬 സിനിമ, ഒ.ടി.ടി & എന്റർടൈൻമെന്റ്:\nവിനോദത്തിനും സബ്സ്ക്രിപ്ഷനുകൾക്കുമായി ₹${entTotal.toLocaleString('en-IN')} ചിലവഴിച്ചിട്ടുണ്ട്.`;
    if (entTotal > 1500) {
      entText += `\n• തിയേറ്റർ ടിക്കറ്റുകൾക്കും ഒ.ടി.ടി പ്ലാറ്റ്‌ഫോമുകൾക്കുമായുള്ള ചിലവ് അല്പം കൂടുതലാണ്. സ്ഥിരമായി കാണാത്ത Hotstar, Netflix, Amazon Prime തുടങ്ങിയ സബ്സ്ക്രിപ്ഷനുകൾ താൽക്കാലികമായി പോസ് (Pause) ചെയ്യുക. പുതിയ റിലീസുകൾക്കായി ആഴ്ചതോറും സിനിമയ്ക്ക് പോകുന്നതിന് പകരം മാസത്തിൽ ഒന്നോ രണ്ടോ തവണയായി ചുരുക്കുന്നത് പ്രതിമാസം ₹1,000 മുതൽ ₹2,500 വരെ ലാഭിക്കാൻ സഹായിക്കും.`;
    } else {
      entText += `\n• എന്റർടൈൻമെന്റ് ചിലവുകൾ നിലവിൽ നിയന്ത്രണ വിധേയമാണ്. സബ്സ്ക്രിപ്ഷനുകൾ കൃത്യസമയത്ത് നിരീക്ഷിക്കുന്നത് ഇതേപോലെ തുടരുക.`;
    }
    sections.push(entText);
  }

  // 3. Food Delivery & Dining (Swiggy, Zomato, Restaurant)
  if (foodTotal > 0 || foodExpenses.length > 0) {
    let foodText = `🍔 ഭക്ഷണവും പുറത്തുനിന്നുള്ള ഓർഡറുകളും:\nഹോട്ടൽ, റസ്റ്റോറന്റ്, ഓൺലൈൻ ഫുഡ് ഡെലിവറി എന്നിവയ്ക്കായി ₹${foodTotal.toLocaleString('en-IN')} ചിലവായിട്ടുണ്ട്.`;
    if (foodTotal > 2000) {
      foodText += `\n• Swiggy, Zomato വഴിയുള്ള ഓർഡറുകളും പുറത്തുനിന്നുള്ള ഭക്ഷണവും മാസ ബജറ്റിനെ കാര്യമായി ബാധിക്കുന്നുണ്ട്. ആഴ്ചയിലെ ഫുഡ് ഡെലിവറികൾ കുറച്ച് വീട്ടിൽ പാകം ചെയ്ത ഭക്ഷണത്തിന് മുൻഗണന നൽകുന്നത് നിങ്ങളുടെ പോക്കറ്റിനും ആരോഗ്യത്തിനും ഒരുപോലെ ഗുണകരമാണ്.`;
    } else {
      foodText += `\n• പുറത്തുനിന്നുള്ള ഭക്ഷണ ചിലവുകൾ നല്ല രീതിയിൽ നിയന്ത്രിച്ചിട്ടുണ്ട്. ഈ സാമ്പത്തിക അച്ചടക്കം ഇതേപോലെ തുടരുക.`;
    }
    sections.push(foodText);
  }

  // 4. Practical Malayalam Savings Tips
  const savingsTips: string[] = [
    `💡 മണിക്കുട്ടി സമ്പാദ്യ ടിപ്പുകൾ:`,
    `• 50-30-20 റൂൾ: വരുമാനത്തിന്റെ 50% അത്യാവശ്യങ്ങൾക്കും (Needs), 30% ആഗ്രഹങ്ങൾക്കും (Wants), ചുരുങ്ങിയത് 20% സമ്പാദ്യത്തിലേക്കും (Savings) മാറ്റിവെക്കാൻ ശ്രദ്ധിക്കുക.`,
    `• ചെറിയ ചിലവുകൾ ശ്രദ്ധിക്കുക: ചായ, ലഘുഭക്ഷണം, ഓൺലൈൻ ടിപ്പുകൾ തുടങ്ങിയ ചെറുകിട ചിലവുകൾ മാസാവസാനം വലിയൊരു തുകയായി മാറും. ഓരോ ദിവസവും ₹50-₹100 ലാഭിക്കാൻ ലക്ഷ്യമിടുക.`,
    `• 24-മണിക്കൂർ റൂൾ: പെട്ടെന്നുള്ള ആവേശത്തിൽ സാധനങ്ങൾ വാങ്ങുന്നതിന് മുൻപ് 24 മണിക്കൂർ കാത്തിരിക്കുക. ഇത് അനാവശ്യ വാങ്ങലുകൾ 70% വരെ ഒഴിവാക്കാൻ സഹായിക്കും.`
  ];
  sections.push(savingsTips.join('\n'));

  return sections.join('\n\n');
}

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const sheetName = url.searchParams.get('sheetName') || 'Personal_Expenses';
    const forceRefresh = url.searchParams.get('forceRefresh') === 'true';
    const cacheKey = `${email.toLowerCase()}:${sheetName}`;
    const cached = adviceCache.get(cacheKey);
    const now = Date.now();

    // 1. Check 15-Minute Cache & Rate Limit Cooldown
    if (cached) {
      const elapsed = now - cached.timestamp;
      const isWithinCache = elapsed < CACHE_TTL_MS;
      const isThrottled = elapsed < MIN_COOLDOWN_MS;

      // If within 15 minutes and not forced, return cached result immediately
      if (isWithinCache && !forceRefresh) {
        const remainingMinutes = Math.ceil((CACHE_TTL_MS - elapsed) / 60000);
        return NextResponse.json({
          success: true,
          advice: cached.advice,
          totalExpenses: cached.totalExpenses,
          topCategories: cached.topCategories,
          categoryBreakdown: cached.categoryBreakdown,
          cached: true,
          nextRefreshInMinutes: remainingMinutes,
          engine: cached.engine,
        });
      }

      // If user forces refresh too quickly (within 60s cooldown), throttle to protect quota
      if (forceRefresh && isThrottled) {
        const waitSeconds = Math.ceil((MIN_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json({
          success: true,
          advice: cached.advice,
          totalExpenses: cached.totalExpenses,
          topCategories: cached.topCategories,
          categoryBreakdown: cached.categoryBreakdown,
          cached: true,
          rateLimited: true,
          message: `ദയവായി ${waitSeconds} സെക്കൻഡുകൾക്ക് ശേഷം വീണ്ടും ശ്രമിക്കുക (Rate limit cooldown).`,
          engine: cached.engine,
        });
      }
    }

    // 2. Fetch User Expenses from Google Sheets
    const isFamily = sheetName === 'Family_Expenses';
    const service = new GoogleSheetsService(email);
    const type = isFamily ? 'Family' : 'Personal';
    let spreadsheetId = await service.findOrCreateSheet(type);

    let rows: any[][] = [];
    if (spreadsheetId) {
      const range = isFamily ? 'Family_Expenses!A:F' : 'Personal_Expenses!A:G';
      rows = await service.getSheetData(spreadsheetId, range);
    }

    // If Personal_Expenses returned 0 data rows, check Family_Expenses as fallback (or vice versa)
    if (rows.length <= 1) {
      const altType = isFamily ? 'Personal' : 'Family';
      const altSheet = isFamily ? 'Personal_Expenses' : 'Family_Expenses';
      try {
        const altSpreadsheetId = await service.findOrCreateSheet(altType);
        if (altSpreadsheetId) {
          const altRange = altType === 'Family' ? 'Family_Expenses!A:F' : 'Personal_Expenses!A:G';
          const altRows = await service.getSheetData(altSpreadsheetId, altRange);
          if (altRows.length > 1) {
            rows = altRows;
          }
        }
      } catch (_) {
        // Continue with primary rows
      }
    }

    // Map rows safely without PII
    const rawExpenses = rows.slice(1).map((row, index) => {
      const amount = parseFloat(row[1]) || 0;
      const category = (row[2] || 'Other').trim();
      const note = (row[3] || '').trim();
      const type = (isFamily ? 'Expense' : row[5] || 'Expense').trim();
      return { id: index + 1, date: row[0], amount, category, note, type };
    });

    const expenses = rawExpenses.filter(
      (e) => e.type.toLowerCase() === 'expense' && e.amount > 0
    );

    if (expenses.length === 0) {
      return NextResponse.json({
        success: true,
        advice: 'നിങ്ങളുടെ ചെലവുകൾ രേഖപ്പെടുത്തിയിട്ടില്ല. ചെലവുകൾ ആഡ് ചെയ്‌താൽ മണിക്കുട്ടിക്ക് മലയാളത്തിൽ സമഗ്രമായ വിശകലനവും സമ്പാദ്യ നിർദ്ദേശങ്ങളും നൽകാൻ സാധിക്കും.',
        headline: 'ചെലവുകൾ രേഖപ്പെടുത്തിയിട്ടില്ല',
        categoryBreakdown: {},
        totalExpenses: 0,
        cached: false,
      });
    }

    // 3. Category aggregation & Pattern Detection
    const categoryTotals: Record<string, number> = {};
    const entertainmentExpenses: { note: string; amount: number }[] = [];
    const foodExpenses: { note: string; amount: number }[] = [];
    let totalExpense = 0;

    for (const exp of expenses) {
      totalExpense += exp.amount;
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;

      const lowerNote = exp.note.toLowerCase();
      const lowerCat = exp.category.toLowerCase();

      const isEntertainment =
        lowerCat.includes('entertainment') ||
        lowerCat.includes('movie') ||
        lowerCat.includes('cinema') ||
        lowerNote.includes('hotstar') ||
        lowerNote.includes('netflix') ||
        lowerNote.includes('prime') ||
        lowerNote.includes('theater') ||
        lowerNote.includes('theatre') ||
        lowerNote.includes('movie') ||
        lowerNote.includes('cinema') ||
        lowerNote.includes('film') ||
        lowerNote.includes('ticket');

      const isFood =
        lowerCat.includes('food') ||
        lowerCat.includes('dining') ||
        lowerNote.includes('swiggy') ||
        lowerNote.includes('zomato') ||
        lowerNote.includes('hotel') ||
        lowerNote.includes('restaurant') ||
        lowerNote.includes('kfc') ||
        lowerNote.includes('mcdonald') ||
        lowerNote.includes('biriyani');

      if (isEntertainment) {
        entertainmentExpenses.push({ note: exp.note || exp.category, amount: exp.amount });
      }
      if (isFood) {
        foodExpenses.push({ note: exp.note || exp.category, amount: exp.amount });
      }
    }

    // Top 5 categories
    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => ({ category: cat, amount: amt }));

    // 4. Try Google Gemini API (if key configured and operational)
    const apiKey = process.env.GEMINI_API_KEY;
    let adviceText = '';
    let engine: 'gemini' | 'rule-based' = 'rule-based';

    if (apiKey) {
      try {
        const sanitizedData = {
          totalSpending: totalExpense,
          topCategories: sortedCategories,
          entertainmentSamples: entertainmentExpenses.slice(-8),
          foodSamples: foodExpenses.slice(-8),
          recentExpenseCount: expenses.length,
        };

        const systemInstruction = `
നിങ്ങൾ "മണിക്കുട്ടി ഫിനാൻഷ്യൽ അഡ്വൈസർ" (Manikutti Smart Financial Advisor) ആണ്.
ഉപയോക്താവിന്റെ ചെലവ് കണക്കുകൾ പരിശോധിച്ച്, പൂർണ്ണമായും ഹൃദ്യവും സ്വാഭാവികവുമായ മലയാളത്തിൽ (Natural Malayalam) സാമ്പത്തിക ഉപദേശങ്ങൾ നൽകുക.

ശ്രദ്ധിക്കേണ്ട പ്രധാന കാര്യങ്ങൾ:
1. തിയേറ്റർ ടിക്കറ്റുകൾ, സിനിമകൾ, Hotstar / Netflix / Amazon Prime തുടങ്ങിയ OTT സബ്സ്ക്രിപ്ഷനുകൾ എന്നിവയ്ക്ക് പണം കൂടുതൽ ചെലവഴിച്ചിട്ടുണ്ടെങ്കിൽ, അനാവശ്യ സബ്സ്ക്രിപ്ഷനുകൾ ഒഴിവാക്കാനും സിനിമകൾക്കായി ചെലവഴിക്കുന്നത് കുറയ്ക്കാനും പ്രായോഗികമായ മലയാളത്തിൽ നിർദ്ദേശം നൽകുക.
2. Swiggy, Zomato, റസ്റ്റോറന്റ് അല്ലെങ്കിൽ പുറത്തുനിന്നുള്ള ഭക്ഷണത്തിന് കൂടുതൽ ചെലവഴിച്ചിട്ടുണ്ടെങ്കിൽ, വീട്ടിൽ പാകം ചെയ്യുന്നത് വർദ്ധിപ്പിച്ച് പണം ലാഭിക്കാൻ സ്നേഹത്തോടെ ഓർമ്മിപ്പിക്കുക.
3. ഏറ്റവും കൂടുതൽ ചെലവായ മറ്റ് വിഭാഗങ്ങളെയും പരാമർശിക്കുക.
4. ഉപദേശങ്ങൾ കുറ്റപ്പെടുത്തുന്ന രീതിയിലാകരുത്, പോസിറ്റീവും പ്രോത്സാഹിപ്പിക്കുന്നതുമായിരിക്കണം.
5. മലയാളത്തിൽ മനോഹരമായ ഇമോജികൾ (Emojis) അടങ്ങിയ ഹെഡിംഗുകളോടെ നൽകുക:
   - 📊 മൊത്തം ചിലവ് വിലയിരുത്തൽ
   - 🎬 സിനിമ, ഒ.ടി.ടി & എന്റർടൈൻമെന്റ് (പ്രസക്തമെങ്കിൽ)
   - 🍔 ഭക്ഷണവും പുറത്തുനിന്നുള്ള ഓർഡറുകളും (പ്രസക്തമെങ്കിൽ)
   - 💡 മണിക്കുട്ടി സമ്പാദ്യ ടിപ്പുകൾ
`;

        const userPrompt = `
ഇതാ ഉപയോക്താവിന്റെ പുതിയ ചെലവ് വിവരങ്ങൾ:
${JSON.stringify(sanitizedData, null, 2)}

ദയവായി ഈ വിവരങ്ങൾ വിശകലനം ചെയ്ത് മലയാളത്തിൽ നിർദ്ദേശങ്ങളും സമ്പാദ്യ ടിപ്പുകളും നൽകുക.
`;

        // Try gemini-1.5-flash with API key in query and header for maximum compatibility
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

        const aiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                parts: [{ text: userPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          }),
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const generated = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generated && generated.trim().length > 0) {
            adviceText = generated.trim();
            engine = 'gemini';
          }
        } else {
          console.warn(`[AI Advisor] Gemini API response status ${aiRes.status}. Engaging intelligent fallback.`);
        }
      } catch (geminiErr) {
        console.warn('[AI Advisor] Gemini request error, falling back:', geminiErr);
      }
    }

    // 5. If Gemini is unavailable or not configured, use intelligent rule-based engine
    if (!adviceText) {
      adviceText = generateIntelligentMalayalamAdvice({
        totalExpense,
        sortedCategories,
        entertainmentExpenses,
        foodExpenses,
      });
      engine = 'rule-based';
    }

    // 6. Cache the successful result for 15 minutes
    adviceCache.set(cacheKey, {
      timestamp: Date.now(),
      advice: adviceText,
      totalExpenses: totalExpense,
      topCategories: sortedCategories,
      categoryBreakdown: categoryTotals,
      engine,
    });

    return NextResponse.json({
      success: true,
      advice: adviceText,
      totalExpenses: totalExpense,
      topCategories: sortedCategories,
      categoryBreakdown: categoryTotals,
      cached: false,
      engine,
    });
  } catch (error: any) {
    console.error('Error in AI expense advisor:', error);
    // Even in case of unexpected errors, provide a friendly Malayalam response
    return NextResponse.json({
      success: true,
      advice: `📊 മൊത്തം ചിലവ് വിലയിരുത്തൽ:\nനിങ്ങളുടെ ചിലവുകൾ പരിശോധിക്കാൻ ശ്രമിക്കുന്നു. ദയവായി ഇന്റർനെറ്റ് കണക്ഷൻ ഉറപ്പുവരുത്തി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.\n\n💡 മണിക്കുട്ടി സമ്പാദ്യ ടിപ്പുകൾ:\n• അനാവശ്യ സബ്സ്ക്രിപ്ഷനുകളും പുറത്തുനിന്നുള്ള ഭക്ഷണവും കുറച്ച് പ്രതിമാസം പണം ലാഭിക്കുക.\n• വരുമാനത്തിന്റെ 20% സമ്പാദ്യത്തിനായി മാറ്റിവെക്കുക.`,
      totalExpenses: 0,
      topCategories: [],
      categoryBreakdown: {},
      cached: false,
      engine: 'rule-based',
    });
  }
}
