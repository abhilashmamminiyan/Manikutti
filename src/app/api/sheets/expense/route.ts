import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from 'next/server';
import { ManikuttiSession } from '@/lib/types';
import { GoogleSheetsService } from '@/lib/googleSheets';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const sheetName = url.searchParams.get('sheetName') || 'Personal_Expenses';

    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet();
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    const rows = await service.getSheetData(spreadsheetId, `${sheetName}!A:G`);
    const expenses = rows.slice(1).map((row, index) => ({
      date: row[0],
      amount: parseFloat(row[1]) || 0,
      category: row[2],
      note: row[3],
      status: row[4],
      paidBy: row[5] || null,
      familyCode: row[6] || null,
      id: index + 1
    }));

    return NextResponse.json({ expenses, spreadsheetId });

  } catch (error: any) {
    if (error.status === 401 || error.code === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sheetName, expense, familyCode } = await request.json();
    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet();
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    const rowData = [
      new Date().toISOString(),
      expense.amount,
      expense.category,
      expense.note || '',
      'Paid',
    ];

    if (sheetName === 'Family_Expenses') {
      rowData.push(session.user?.email || 'Unknown', familyCode || '');
      await service.appendRow(spreadsheetId, 'Family_Expenses', rowData);
    } else {
      await service.appendRow(spreadsheetId, 'Personal_Expenses', rowData);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    if (error.status === 401 || error.code === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
