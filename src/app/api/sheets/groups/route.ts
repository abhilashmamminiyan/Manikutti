import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from 'next/server';
import { ManikuttiSession } from '@/lib/types';
import { google } from 'googleapis';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
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
    if (error.status === 401 || error.code === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
