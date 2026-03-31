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
    const type = sheetName === 'Family_Expenses' ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(type);
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    const range = sheetName === 'Family_Expenses' ? 'A:F' : 'A:G';
    const rows = await service.getSheetData(spreadsheetId, `${sheetName}!${range}`);
    const expenses = rows.slice(1).map((row, index) => {
      if (sheetName === 'Family_Expenses') {
        return {
          date: row[0],
          amount: parseFloat(row[1]) || 0,
          category: row[2],
          note: row[3],
          addedBy: row[4],
          familyCode: row[5],
          id: index + 1
        };
      }
      return {
        date: row[0],
        amount: parseFloat(row[1]) || 0,
        category: row[2],
        note: row[3],
        isPaid: row[4] === 'TRUE' || row[4] === 'true' || row[4] === 'Paid',
        type: row[5] || 'Expense',
        id: index + 1
      };
    });

    return NextResponse.json({ expenses, spreadsheetId });

  } catch (error: any) {
    console.error('Error in expense GET:', error);
    if (error.status === 401 || error.code === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sheetName, expense, familyCode } = await request.json();
    const service = new GoogleSheetsService(session);
    const type = sheetName === 'Family_Expenses' ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(type);
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    if (sheetName === 'Family_Expenses') {
      // Admin Check
      const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
      const userRole = members.slice(1).find(m => m[0] === familyCode && m[1] === session.user?.email)?.[2];
      
      if (userRole !== 'Admin') {
        return NextResponse.json({ error: 'Only Admins can add family expenses' }, { status: 403 });
      }

      const rowData = [
        expense.date || new Date().toISOString(),
        expense.amount,
        expense.category,
        expense.note || '',
        session.user?.email || 'Unknown',
        familyCode || ''
      ];
      await service.appendRow(spreadsheetId, 'Family_Expenses', rowData);
    } else {
      const rowData = [
        expense.date || new Date().toISOString(),
        expense.amount,
        expense.category,
        expense.note || '',
        expense.isPaid ?? true,
        expense.type || 'Expense'
      ];
      await service.appendRow(spreadsheetId, 'Personal_Expenses', rowData);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    if (error.status === 401 || error.code === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, sheetName, isPaid } = await request.json();
    if (id === undefined || !sheetName || isPaid === undefined) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });

    const service = new GoogleSheetsService(session);
    const type = sheetName === 'Family_Expenses' ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(type);
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    const rowIndex = id + 1; // Row 1 is header, index 0 in GET's slice(1) is row 2
    const range = `${sheetName}!E${rowIndex}`;

    await service.updateRow(spreadsheetId, range, [isPaid]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    if (error.status === 401 || error.code === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
