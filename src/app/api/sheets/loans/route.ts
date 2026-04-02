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
    const familyCode = url.searchParams.get('familyCode');
    if (!familyCode) return NextResponse.json({ error: 'Family code required' }, { status: 400 });

    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ loans: [] });

    const [loansRows, expensesRows] = await Promise.all([
      service.getSheetData(spreadsheetId, 'Loans!A:E'),
      service.getSheetData(spreadsheetId, 'Loan_Expenses!A:G')
    ]);

    const loans = loansRows.slice(1)
      .filter(r => r[2] === familyCode)
      .map(r => ({
        name: r[0],
        amount: parseFloat(r[1]) || 0,
        familyCode: r[2],
        adminEmail: r[3],
        status: r[4] || 'Active'
      }));

    const expenses = expensesRows.slice(1)
      .filter(r => r[6] === familyCode)
      .map(r => ({
        date: r[0],
        amount: parseFloat(r[1]) || 0,
        category: r[2],
        note: r[3],
        loanName: r[4],
        addedBy: r[5],
        familyCode: r[6]
      }));

    return NextResponse.json({ loans, expenses });

  } catch (error: any) {
    console.error('Loans GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, loanName, amount, familyCode, expense } = await request.json();
    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    if (action === 'addLoan') {
      await service.appendRow(spreadsheetId, 'Loans', [
        loanName,
        amount,
        familyCode,
        session.user?.email,
        'Active'
      ]);
      return NextResponse.json({ success: true });
    }

    if (action === 'addLoanExpense') {
      await service.appendRow(spreadsheetId, 'Loan_Expenses', [
        expense.date || new Date().toISOString(),
        expense.amount,
        expense.category || 'Loan Repayment',
        expense.note || '',
        loanName,
        session.user?.email,
        familyCode
      ]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Loans POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
