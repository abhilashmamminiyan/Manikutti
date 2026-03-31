import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from 'next/server';
import { ManikuttiSession } from '@/lib/types';
import { GoogleSheetsService } from '@/lib/googleSheets';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new GoogleSheetsService(session);
    // Try to find a family sheet first for shared history, fallback to personal
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
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { expression, result } = await request.json();
    const service = new GoogleSheetsService(session);
    
    let spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) {
      spreadsheetId = await service.findOrCreateSheet('Personal');
    }

    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    const rowData = [
      new Date().toISOString(),
      session.user?.email || 'Unknown',
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
