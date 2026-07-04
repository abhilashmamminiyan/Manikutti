import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const familyCode = url.searchParams.get('familyCode');
    if (!familyCode) return NextResponse.json({ error: 'Family code required' }, { status: 400 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ notifications: [] });

    const rows = await service.getSheetData(spreadsheetId, 'Notifications!A:F');
    const notifications = rows.slice(1)
      .filter(r => r[3] === familyCode)
      .map((r, index) => ({
        date: r[0],
        title: r[1],
        message: r[2],
        familyCode: r[3],
        type: r[4] || 'general',
        createdBy: r[5] || '',
        id: index + 1
      }))
      .reverse(); // Newest first

    return NextResponse.json({ notifications });

  } catch (error: any) {
    console.error('Notifications GET Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
