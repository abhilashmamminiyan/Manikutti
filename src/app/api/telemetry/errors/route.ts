import { NextResponse } from 'next/server';
import { getAuthUserEmail } from '@/lib/authHelper';
import {
  isAdminEmail,
  logErrorTelemetry,
  queryErrorTelemetry,
  type TelemetryErrorInput,
} from '@/lib/errorTelemetry';

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const rawItems: TelemetryErrorInput[] = Array.isArray(body?.items)
      ? body.items
      : body?.item
        ? [body.item]
        : body?.message
          ? [body]
          : [];

    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'No telemetry items provided' }, { status: 400 });
    }

    const capped = rawItems.slice(0, 25);
    await Promise.all(
      capped.map((item) =>
        logErrorTelemetry({
          ...item,
          userEmail: item.userEmail || email,
          source: item.source || 'mobile',
        })
      )
    );

    return NextResponse.json({ success: true, recorded: capped.length });
  } catch (error) {
    console.error('[Telemetry POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to record telemetry' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const aiKey = process.env.AI_TELEMETRY_KEY?.trim();
    const providedKey = request.headers.get('x-ai-telemetry-key')?.trim();
    const authorizedViaKey = Boolean(aiKey && providedKey && providedKey === aiKey);

    let actorEmail: string | undefined;
    if (!authorizedViaKey) {
      const email = await getAuthUserEmail(request);
      if (!email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const admin = await isAdminEmail(email);
      if (!admin) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
      actorEmail = email;
    }

    const url = new URL(request.url);
    const limitParam = parseInt(url.searchParams.get('limit') || '100', 10);
    const severity = url.searchParams.get('severity') || undefined;
    const source = url.searchParams.get('source') || undefined;

    const errors = await queryErrorTelemetry({
      limit: Number.isFinite(limitParam) ? limitParam : 100,
      severity,
      source,
      actorEmail,
    });

    const summary = {
      total: errors.length,
      fatal: errors.filter((e) => e.severity.toLowerCase() === 'fatal').length,
      error: errors.filter((e) => e.severity.toLowerCase() === 'error').length,
      warn: errors.filter((e) => e.severity.toLowerCase() === 'warn').length,
    };

    return NextResponse.json({ errors, summary });
  } catch (error) {
    console.error('[Telemetry GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to load telemetry logs' }, { status: 500 });
  }
}
