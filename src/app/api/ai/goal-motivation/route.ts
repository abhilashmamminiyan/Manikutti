import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CachedMotivation {
  timestamp: number;
  motivation: string;
  headline: string;
  engine: 'gemini' | 'rule-based';
}

// 30-Minute in-memory cache per user/family
const CACHE_TTL_MS = 30 * 60 * 1000;
const motivationCache = new Map<string, CachedMotivation>();

/**
 * Intelligent rule-based Malayalam family goal motivation fallback.
 * Generates inspiring, contextual Malayalam quotes based on progress.
 */
function generateIntelligentFamilyMotivation(params: {
  topGoalTitle?: string;
  topGoalProgress?: number;
  overallProgress: number;
  activeCount: number;
}): { motivation: string; headline: string } {
  const { topGoalTitle, topGoalProgress = 0, overallProgress, activeCount } = params;

  if (activeCount === 0) {
    return {
      headline: 'പുതിയ ലക്ഷ്യം നിശ്ചയിക്കൂ',
      motivation: 'ഒരുമിച്ചുള്ള ചെറിയ സമ്പാദ്യങ്ങൾ കുടുംബത്തിന്റെ വലിയ സ്വപ്നങ്ങൾ സാക്ഷാത്കരിക്കും. നിങ്ങളുടെ ആദ്യ കുടുംബ ലക്ഷ്യം ഇന്ന് തന്നെ നിശ്ചയിക്കൂ! ✨',
    };
  }

  if (topGoalProgress >= 80) {
    return {
      headline: 'സ്വപ്നം കൈയെത്തും ദൂരത്ത്! 🎯',
      motivation: topGoalTitle
        ? `'${topGoalTitle}' എന്ന കുടുംബ ലക്ഷ്യം പൂർത്തിയാക്കാൻ ഇനി വെറും ${100 - Math.round(topGoalProgress)}% മാത്രം ബാക്കി! കുടുംബാംഗങ്ങളുടെ ഒത്തൊരുമിച്ചുള്ള പരിശ്രമത്തിന് ഉടൻ ഫലം കാണും. 🚀`
        : `നിങ്ങളുടെ കുടുംബ ലക്ഷ്യം വിജയത്തിലേക്ക് അടുക്കുകയാണ്! ഈ മാസം തന്നെ ലക്ഷ്യം സാക്ഷാത്കരിക്കാൻ ഒരുമിച്ച് മുന്നേറാം. ✨`,
    };
  }

  if (overallProgress >= 50) {
    return {
      headline: 'പകുതിയിലധികം മുന്നേറ്റം! 🌟',
      motivation: topGoalTitle
        ? `'${topGoalTitle}' ഉൾപ്പെടെയുള്ള കുടുംബ ലക്ഷ്യങ്ങൾ പകുതിയിലധികം പൂർത്തിയായിക്കഴിഞ്ഞു. ഇതേ സാമ്പത്തിക അച്ചടക്കത്തോടെ മുന്നോട്ട് പോയാൽ വളരെ വേഗത്തിൽ ലക്ഷ്യത്തിലെത്താം. 👏`
        : `കുടുംബത്തിന്റെ സാമ്പത്തിക ലക്ഷ്യങ്ങൾ പകുതിയിലധികം പിന്നിട്ടിരിക്കുന്നു. ഒത്തൊരുമയോടെയുള്ള ഈ സമ്പാദ്യ ശീലം അഭിനന്ദനാർഹമാണ്! 🏡`,
    };
  }

  return {
    headline: 'ലക്ഷ്യത്തിലേക്ക് ഒരുമിച്ച് മുന്നേറാം! 🚀',
    motivation: topGoalTitle
      ? `'${topGoalTitle}' എന്ന കുടുംബ ലക്ഷ്യത്തിലേക്കുള്ള ഓരോ ചെറിയ സമ്പാദ്യവും വലിയൊരു ചുവടുവെപ്പാണ്. സ്ഥിരതയുള്ള സമ്പാദ്യം സ്വപ്നങ്ങളെ യാഥാർത്ഥ്യമാക്കും. 💡`
      : `ചെറിയ തുള്ളികൾ ചേർന്നാണ് സമുദ്രമുണ്ടാകുന്നത്. കുടുംബത്തിന്റെ ലക്ഷ്യങ്ങൾക്കായി ഓരോ ദിവസവും ചെറിയൊരു തുക മാറ്റിവെക്കൂ. ✨`,
  };
}

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('forceRefresh') === 'true';
    const sheetType = url.searchParams.get('sheetType') || 'family';
    const isFamily = sheetType.toLowerCase() === 'family';

    const cacheKey = `goals:${email.toLowerCase()}:${sheetType}`;
    const cached = motivationCache.get(cacheKey);
    const now = Date.now();

    if (cached && !forceRefresh && (now - cached.timestamp < CACHE_TTL_MS)) {
      return NextResponse.json({
        success: true,
        motivation: cached.motivation,
        headline: cached.headline,
        engine: cached.engine,
        cached: true,
        nextRefreshMinutes: Math.ceil((CACHE_TTL_MS - (now - cached.timestamp)) / 60000),
      });
    }

    // Read active goals from Google Sheets
    const service = new GoogleSheetsService(email);
    const targetType = isFamily ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(targetType);

    let activeGoals: any[] = [];
    let topGoal: any = null;
    let overallProgress = 0;

    if (spreadsheetId) {
      const tabName = isFamily ? 'Family_Goals' : 'Goals';
      const rows = await service.getSheetData(spreadsheetId, `${tabName}!A:I`);

      if (rows && rows.length > 1) {
        const parsed = rows.slice(1).map((row, index) => {
          const target = parseFloat(row[1]) || 0;
          const current = parseFloat(row[2]) || 0;
          return {
            id: index + 1,
            title: (row[0] || '').toString().trim(),
            targetAmount: target,
            currentAmount: current,
            status: (row[3] || 'Active').toString().trim(),
            goalType: (row[4] || 'Saving').toString().trim(),
            progressPercentage: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
          };
        }).filter(g => g.title && g.status.toLowerCase() === 'active');

        activeGoals = parsed;
        const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
        const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
        overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

        if (activeGoals.length > 0) {
          topGoal = [...activeGoals].sort((a, b) => b.progressPercentage - a.progressPercentage)[0];
        }
      }
    }

    if (activeGoals.length === 0) {
      const fallback = generateIntelligentFamilyMotivation({ activeCount: 0, overallProgress: 0 });
      return NextResponse.json({
        success: true,
        motivation: fallback.motivation,
        headline: fallback.headline,
        engine: 'rule-based',
        cached: false,
      });
    }

    // Try Google Gemini 1.5 Flash API
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const sanitizedGoals = {
          activeGoalsCount: activeGoals.length,
          topGoalTitle: topGoal?.title,
          topGoalTarget: topGoal?.targetAmount,
          topGoalCurrentSaved: topGoal?.currentAmount,
          topGoalProgressPercent: topGoal?.progressPercentage,
          topGoalType: topGoal?.goalType,
          overallFamilyProgress: overallProgress,
        };

        const systemInstruction = `
നിങ്ങൾ "മണിക്കുട്ടി കുടുംബ ലക്ഷ്യം കോച്ച്" (Manikutti Family Financial & Goal Coach) ആണ്.
കുടുംബത്തിന്റെ സാമ്പത്തിക ലക്ഷ്യങ്ങളും സമ്പാദ്യ പുരോഗതിയും പരിശോധിച്ച്, പൂർണ്ണമായും ഹൃദ്യവും സ്വാഭാവികവുമായ മലയാളത്തിൽ (Natural Malayalam) 1 അല്ലെങ്കിൽ 2 വരികളിൽ കുടുംബാംഗങ്ങളെ ഒത്തൊരുമിച്ച് ലക്ഷ്യത്തിലെത്താൻ പ്രോത്സാഹിപ്പിക്കുന്ന മനോഹരമായ ഒരു പ്രചോദനാത്മക സന്ദേശം (Motivational Quote/Advice) നൽകുക.

ശ്രദ്ധിക്കേണ്ട കാര്യങ്ങൾ:
1. പ്രതികരണത്തിൽ കുടുംബ ഐക്യവും (Family teamwork), ഒരുമിച്ചുള്ള സമ്പാദ്യവും എടുത്ത് പറയുക.
2. സന്ദേശം ഹ്രസ്വമായിരിക്കണം (പരമാവധി 2 വാക്യങ്ങൾ).
3. മനോഹരമായ ഇമോജികൾ (Emojis) ഉപയോഗിക്കുക.
4. JSON ഫോർമാറ്റിൽ മാത്രം മറുപടി നൽകുക:
{"headline": "ലളിതമായ തലക്കെട്ട്", "motivation": "മലയാളത്തിലുള്ള പ്രചോദനാത്മക സന്ദേശം"}
`;

        const userPrompt = `ഇതാ കുടുംബത്തിന്റെ നിലവിലെ ലക്ഷ്യ വിവരങ്ങൾ: ${JSON.stringify(sanitizedGoals)}`;

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
              maxOutputTokens: 300,
            },
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

          // Parse JSON from Gemini
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.motivation) {
              const result: CachedMotivation = {
                timestamp: now,
                motivation: parsed.motivation,
                headline: parsed.headline || 'കുടുംബ ലക്ഷ്യങ്ങൾ 🚀',
                engine: 'gemini',
              };
              motivationCache.set(cacheKey, result);

              return NextResponse.json({
                success: true,
                motivation: result.motivation,
                headline: result.headline,
                engine: 'gemini',
                cached: false,
              });
            }
          }
        }
      } catch (geminiError) {
        console.warn('Gemini Goal Motivation fallback engaged:', geminiError);
      }
    }

    // Rule-based fallback engine
    const fallback = generateIntelligentFamilyMotivation({
      topGoalTitle: topGoal?.title,
      topGoalProgress: topGoal?.progressPercentage,
      overallProgress,
      activeCount: activeGoals.length,
    });

    const result: CachedMotivation = {
      timestamp: now,
      motivation: fallback.motivation,
      headline: fallback.headline,
      engine: 'rule-based',
    };
    motivationCache.set(cacheKey, result);

    return NextResponse.json({
      success: true,
      motivation: result.motivation,
      headline: result.headline,
      engine: 'rule-based',
      cached: false,
    });

  } catch (error: any) {
    console.error('Error in goal-motivation GET:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
