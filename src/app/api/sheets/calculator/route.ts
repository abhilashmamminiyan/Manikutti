import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new GoogleSheetsService(email);
    // Use family sheet (which resolves to the admin spreadsheet), fallback to personal
    let spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) {
      spreadsheetId = await service.findOrCreateSheet('Personal');
    }

    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    const rows = await service.getSheetData(spreadsheetId, 'Calculator_History!A:D');
    const history = rows.slice(1).reverse().slice(0, 20).map((row) => ({
      date: row[0],
      user: row[1],
      expression: row[2],
      result: row[3],
    }));

    return NextResponse.json({ history });

  } catch (error: any) {
    console.error('Error in calculator GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { expression, result } = await request.json();
    const service = new GoogleSheetsService(email);
    
    let spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) {
      spreadsheetId = await service.findOrCreateSheet('Personal');
    }

    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    const rowData = [
      new Date().toISOString(),
      email,
      expression,
      result.toString()
    ];

    await service.appendRow(spreadsheetId, 'Calculator_History', rowData);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in calculator POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
