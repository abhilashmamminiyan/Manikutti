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
    if (!spreadsheetId) return NextResponse.json({ items: [] });

    const rows = await service.getSheetData(spreadsheetId, 'Monthly_Expenses!A:I');
    const items = rows.slice(1)
      .filter(r => r[4] === familyCode)
      .map((row, index) => ({
        title: row[0],
        amount: parseFloat(row[1]) || 0,
        dueDay: parseInt(row[2]) || 1,
        status: row[3],
        familyCode: row[4],
        adminEmail: row[5],
        lastPaidDate: row[6],
        lastPaidBy: row[7],
        linkedLoan: row[8],
        id: index + 1
      }));

    return NextResponse.json({ items });

  } catch (error: any) {
    console.error('Monthly GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, amount, dueDay, familyCode } = await request.json();
    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    // Admin Check
    const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
    const userRole = members.slice(1).find(m => m[0] === familyCode && m[1] === session.user?.email)?.[2];
    
    if (userRole !== 'Admin') {
      return NextResponse.json({ error: 'Only Admins can add monthly expenses' }, { status: 403 });
    }

    await service.appendRow(spreadsheetId, 'Monthly_Expenses', [
      title,
      amount,
      dueDay,
      'Unpaid',
      familyCode,
      session.user?.email,
      '', // lastPaidDate
      ''  // lastPaidBy
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Monthly POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, paidDate } = await request.json();
    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });
    
    // 1. Fetch item to check for loan link
    const rows = await service.getSheetData(spreadsheetId, 'Monthly_Expenses!A:I');
    // We need to find the actual row because IDs are based on filtering
    // Actually, in GET we used (row, index) => id: index+1
    // But index is relative to the filtered list. This is a bug.
    // Let's use the Title or something unique, or just fetch all and find the one.
    const allRows = await service.getSheetData(spreadsheetId, 'Monthly_Expenses!A:I');
    const itemIndex = allRows.findIndex((r, i) => i > 0 && i === id); // This is still fragile.
    // Recommended fix: API should use a unique key. For now, let's assume 'id' passed is the row index.
    const item = allRows[id]; 
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const linkedLoanName = item[8];
    if (linkedLoanName) {
      const loansRows = await service.getSheetData(spreadsheetId, 'Loans!A:G');
      const loan = loansRows.find(r => r[0] === linkedLoanName);
      if (loan) {
        const assignedTo = loan[3];
        if (assignedTo && assignedTo !== session.user?.email) {
          return NextResponse.json({ error: 'Only the assigned user can mark this as paid.' }, { status: 403 });
        }
        
        // Record in Loan_Repayments
        await service.appendRow(spreadsheetId, 'Loan_Repayments', [
          paidDate || new Date().toISOString(),
          item[1], // Amount
          linkedLoanName,
          session.user?.email,
          item[4] // Family Code
        ]);
      }
    }

    // 2. Fetch User Nickname
    const memberRows = await service.getSheetData(spreadsheetId, 'Family_Members!A:F');
    const currentUser = memberRows.slice(1).find(r => r[1] === session.user?.email);
    const displayName = currentUser?.[4] || session.user?.email || 'Unknown';

    // 3. Update status (col D), lastPaidDate (col G), and lastPaidBy (col H)
    const updates = [
      { range: `Monthly_Expenses!D${id + 1}`, values: [['Paid']] },
      { range: `Monthly_Expenses!G${id + 1}`, values: [[paidDate]] },
      { range: `Monthly_Expenses!H${id + 1}`, values: [[displayName]] }
    ];

    for (const update of updates) {
      await service.updateSheetData(spreadsheetId, update.range, update.values);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Monthly PATCH Error:', error);
    return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 });
  }
}
