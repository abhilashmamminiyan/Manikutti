import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthUserEmail, parsePrivateKey } from '@/lib/authHelper';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = parsePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);

    if (!clientEmail || !privateKey) {
      return NextResponse.json({ error: 'Google Service Account credentials missing' }, { status: 500 });
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Find spreadsheet
    const fileList = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.spreadsheet' and name='Manikutti_v1' and trashed=false`,
      fields: 'files(id)',
    });

    const spreadsheetId = fileList.data.files?.[0]?.id;
    if (!spreadsheetId) return NextResponse.json({ groups: [] });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Groups!A:B',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return NextResponse.json({ groups: [] });

    const groups = rows.slice(1).map(row => ({
      name: row[0],
      members: row[1]?.split(',') || [],
    }));

    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error('Error in groups GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
