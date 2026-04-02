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

    const [loansRows, expensesRows, repaymentRows] = await Promise.all([
      service.getSheetData(spreadsheetId, 'Loans!A:G'),
      service.getSheetData(spreadsheetId, 'Loan_Expenses!A:G'),
      service.getSheetData(spreadsheetId, 'Loan_Repayments!A:E')
    ]);

    const loans = loansRows.slice(1)
      .filter(r => r[4] === familyCode)
      .map(r => ({
        name: r[0],
        amount: parseFloat(r[1]) || 0,
        monthlyEMI: parseFloat(r[2]) || 0,
        assignedTo: r[3],
        familyCode: r[4],
        adminEmail: r[5],
        status: r[6] || 'Active'
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

    const repayments = repaymentRows.slice(1)
      .filter(r => r[4] === familyCode)
      .map(r => ({
        date: r[0],
        amount: parseFloat(r[1]) || 0,
        loanName: r[2],
        paidBy: r[3],
        familyCode: r[4]
      }));

    return NextResponse.json({ loans, expenses, repayments });

  } catch (error: any) {
    console.error('Loans GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, loanName, amount, monthlyEMI, assignedTo, familyCode, expense } = await request.json();
    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    if (action === 'addLoan') {
      await service.appendRow(spreadsheetId, 'Loans', [
        loanName,
        amount,
        monthlyEMI,
        assignedTo,
        familyCode,
        session.user?.email,
        'Active'
      ]);

      await service.appendRow(spreadsheetId, 'Monthly_Expenses', [
        `EMI: ${loanName}`,
        monthlyEMI,
        1,
        'Unpaid',
        familyCode,
        session.user?.email,
        '',
        '',
        loanName
      ]);

      return NextResponse.json({ success: true });
    }

    if (action === 'addLoanExpense') {
      await service.appendRow(spreadsheetId, 'Loan_Expenses', [
        expense.date || new Date().toISOString(),
        expense.amount,
        expense.category || 'Loan Spend',
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
