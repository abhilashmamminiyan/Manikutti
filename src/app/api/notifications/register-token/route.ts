import { NextResponse } from 'next/server';
import { getAuthUserEmail } from '@/lib/authHelper';
import { registerUserFcmToken, upsertUserRecordInFirestore } from '@/lib/featurePermissions';
import { isFirebaseConfigured } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const fcmToken = (body?.fcmToken || '').toString().trim();
    const personalSpreadsheetId = (body?.personalSpreadsheetId || '').toString().trim();

    if (!fcmToken) {
      return NextResponse.json({ error: 'fcmToken is required' }, { status: 400 });
    }

    if (!isFirebaseConfigured()) {
      return NextResponse.json({
        success: false,
        stored: false,
        reason: 'Firebase service account not configured on server',
      });
    }

    const stored = await registerUserFcmToken(email, fcmToken);
    if (personalSpreadsheetId) {
      await upsertUserRecordInFirestore(email, { googleDriveId: personalSpreadsheetId });
    }

    return NextResponse.json({ success: stored, stored });
  } catch (error: unknown) {
    console.error('[Register FCM Token] Error:', error);
    return NextResponse.json(
      { error: 'Failed to register token', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
