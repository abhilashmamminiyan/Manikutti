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
}

// 15-minute in-memory cache to stay well within Gemini's Free Tier limits
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MIN_COOLDOWN_MS = 60 * 1000; // 1 minute minimum cooldown between fresh API calls
const adviceCache = new Map<string, CachedAdvice>();

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

    // 1. Check 15-Minute Cache & Rate Limit
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
        });
      }

      // If user forces refresh too quickly (within 60s cooldown), throttle to protect 15 RPM quota
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
        });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY is not configured on the server. Please set it in Vercel environment variables.',
        },
        { status: 500 }
      );
    }

    const isFamily = sheetName === 'Family_Expenses';
    const service = new GoogleSheetsService(email);
    const type = isFamily ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(type);
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 404 });
    }

    const range = isFamily ? 'Family_Expenses!A:F' : 'Personal_Expenses!A:G';
    const rows = await service.getSheetData(spreadsheetId, range);

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
        advice: 'നിങ്ങളുടെ ചെലവുകൾ രേഖപ്പെടുത്തിയിട്ടില്ല. ചെലവുകൾ ആഡ് ചെയ്‌താൽ മണിക്കുട്ടിക്ക് മലയാളത്തിൽ വിശകലനവും നിർദ്ദേശങ്ങളും നൽകാൻ സാധിക്കും.',
        headline: 'ചെലവുകൾ രേഖപ്പെടുത്തിയിട്ടില്ല',
        categoryBreakdown: {},
        totalExpenses: 0,
        cached: false,
      });
    }

    // Category aggregation
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

    // Prepare anonymized sanitized prompt payload
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

    const aiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
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

    // Handle Gemini 429 Rate Limit specifically
    if (aiRes.status === 429) {
      console.warn('Gemini 429 Rate Limit hit. Falling back to cached advice if available.');
      if (cached) {
        return NextResponse.json({
          success: true,
          advice: cached.advice,
          totalExpenses: cached.totalExpenses,
          topCategories: cached.topCategories,
          categoryBreakdown: cached.categoryBreakdown,
          cached: true,
          rateLimited: true,
          message: 'AI സെർവർ തിരക്കിലായതിനാൽ മുൻപ് ലഭ്യമാക്കിയ നിർദ്ദേശങ്ങൾ കാണിക്കുന്നു.',
        });
      }
      return NextResponse.json(
        {
          error: 'AI സേവനം താൽക്കാലികമായി തിരക്കിലാണ്. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.',
          rateLimited: true,
        },
        { status: 429 }
      );
    }

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('Gemini API call failed:', errText);
      return NextResponse.json(
        { error: 'Gemini API failed to process request', details: errText },
        { status: aiRes.status }
      );
    }

    const aiJson = await aiRes.json();
    const adviceText =
      aiJson.candidates?.[0]?.content?.parts?.[0]?.text ||
      'വിവരങ്ങൾ വിജയകരമായി വിശകലനം ചെയ്യാൻ കഴിഞ്ഞില്ല.';

    // Cache the successful result for 15 minutes
    adviceCache.set(cacheKey, {
      timestamp: Date.now(),
      advice: adviceText,
      totalExpenses: totalExpense,
      topCategories: sortedCategories,
      categoryBreakdown: categoryTotals,
    });

    return NextResponse.json({
      success: true,
      advice: adviceText,
      totalExpenses: totalExpense,
      topCategories: sortedCategories,
      categoryBreakdown: categoryTotals,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error in AI expense advisor:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
