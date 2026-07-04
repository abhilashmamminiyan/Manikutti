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

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, message } = await request.json();
    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Family sheet not found' }, { status: 500 });

    // Find the user's family code from Family_Members
    const memberRows = await service.getSheetData(spreadsheetId, 'Family_Members!A:F');
    const userRow = memberRows.slice(1).find(r => r[1]?.toString().trim().toLowerCase() === email.toLowerCase());
    if (!userRow) {
      return NextResponse.json({ error: 'User is not part of a family' }, { status: 403 });
    }
    const familyCode = userRow[0]?.toString().trim();

    // Check if the user is an Admin
    if (userRow[2] !== 'Admin') {
      return NextResponse.json({ error: 'Only Admins can send notifications' }, { status: 403 });
    }

    // Append notification row
    await service.appendRow(spreadsheetId, 'Notifications', [
      new Date().toISOString(),
      title,
      message,
      familyCode,
      'general',
      email
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notifications POST Error:', error);
    return NextResponse.json({ error: 'Failed to send notification', details: error.message }, { status: 500 });
  }
}
