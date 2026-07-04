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
    if (!spreadsheetId) return NextResponse.json({ loans: [] });

    const [loansRows, expensesRows, repaymentRows] = await Promise.all([
      service.getSheetData(spreadsheetId, 'Loans!A:G'),
      service.getSheetData(spreadsheetId, 'Loan_Expenses!A:G'),
      service.getSheetData(spreadsheetId, 'Loan_Repayments!A:E')
    ]);

    const loans = loansRows.slice(1)
      .map((r, index) => ({
        name: r[0],
        amount: parseFloat(r[1]) || 0,
        monthlyEMI: parseFloat(r[2]) || 0,
        assignedTo: r[3]?.toString().trim() || '',
        familyCode: r[4],
        adminEmail: r[5],
        status: r[6] || 'Active',
        id: index + 1
      }))
      .filter(r => r.familyCode === familyCode);

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
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, loanName, amount, monthlyEMI, assignedTo, familyCode, expense } = await request.json();
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    if (action === 'addLoan') {
      await service.appendRow(spreadsheetId, 'Loans', [
        loanName,
        amount,
        monthlyEMI,
        assignedTo,
        familyCode,
        email,
        'Active'
      ]);

      await service.appendRow(spreadsheetId, 'Monthly_Expenses', [
        `EMI: ${loanName}`,
        monthlyEMI,
        1,
        'Unpaid',
        familyCode,
        email,
        '',
        '',
        loanName,
        assignedTo
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
        email,
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

export async function PUT(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, name, amount, monthlyEMI, assignedTo, status } = await request.json();
    if (id === undefined || !name || amount === undefined || monthlyEMI === undefined || !assignedTo || !status) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    // Admin Check
    const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
    const memberRow = members.slice(1).find(m => m[1]?.toLowerCase() === email.toLowerCase());
    if (!memberRow || memberRow[2] !== 'Admin') {
      return NextResponse.json({ error: 'Only Admins can update loans' }, { status: 403 });
    }

    // Get the old loan name to find linked monthly dues
    const oldLoans = await service.getSheetData(spreadsheetId, 'Loans!A:G');
    const oldLoanRow = oldLoans[id]; // row index is id
    if (!oldLoanRow) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    const oldLoanName = oldLoanRow[0];

    const rowIndex = id + 1; // row index in sheet is id + 1

    // Update the Loan entry: Name (col A), Amount (col B), EMI (col C), Assigned To (col D), Status (col G)
    const loanUpdates = [
      { range: `Loans!A${rowIndex}`, values: [[name]] },
      { range: `Loans!B${rowIndex}`, values: [[amount]] },
      { range: `Loans!C${rowIndex}`, values: [[monthlyEMI]] },
      { range: `Loans!D${rowIndex}`, values: [[assignedTo]] },
      { range: `Loans!G${rowIndex}`, values: [[status]] }
    ];

    for (const update of loanUpdates) {
      await service.updateSheetData(spreadsheetId, update.range, update.values);
    }

    // Now, synchronize with Monthly_Expenses
    const monthlyRows = await service.getSheetData(spreadsheetId, 'Monthly_Expenses!A:J');
    const linkedDuesIndex = monthlyRows.findIndex(r => r[8] === oldLoanName); // col I (linkedLoan) is index 8

    if (linkedDuesIndex !== -1) {
      const duesRowIndex = linkedDuesIndex + 1; // row index in sheet is index + 1
      const duesUpdates = [
        { range: `Monthly_Expenses!A${duesRowIndex}`, values: [[`EMI: ${name}`]] },
        { range: `Monthly_Expenses!B${duesRowIndex}`, values: [[monthlyEMI]] },
        { range: `Monthly_Expenses!I${duesRowIndex}`, values: [[name]] }, // Update the link pointer as well
        { range: `Monthly_Expenses!J${duesRowIndex}`, values: [[assignedTo]] }
      ];

      for (const update of duesUpdates) {
        await service.updateSheetData(spreadsheetId, update.range, update.values);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Loans PUT Error:', error);
    return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const idStr = url.searchParams.get('id');
    if (!idStr) return NextResponse.json({ error: 'ID parameter required' }, { status: 400 });
    const id = parseInt(idStr);

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    // Admin Check
    const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
    const memberRow = members.slice(1).find(m => m[1]?.toLowerCase() === email.toLowerCase());
    if (!memberRow || memberRow[2] !== 'Admin') {
      return NextResponse.json({ error: 'Only Admins can delete loans' }, { status: 403 });
    }

    // Get the loan name to delete linked monthly dues
    const oldLoans = await service.getSheetData(spreadsheetId, 'Loans!A:G');
    const oldLoanRow = oldLoans[id];
    if (!oldLoanRow) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    const loanName = oldLoanRow[0];

    const rowIndex = id + 1;
    await service.deleteRow(spreadsheetId, 'Loans', rowIndex);

    // Now, synchronize and delete from Monthly_Expenses
    const monthlyRows = await service.getSheetData(spreadsheetId, 'Monthly_Expenses!A:J');
    const linkedDuesIndex = monthlyRows.findIndex(r => r[8] === loanName); // col I (linkedLoan) is index 8

    if (linkedDuesIndex !== -1) {
      const duesRowIndex = linkedDuesIndex + 1;
      await service.deleteRow(spreadsheetId, 'Monthly_Expenses', duesRowIndex);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Loans DELETE Error:', error);
    return NextResponse.json({ error: 'Delete failed', details: error.message }, { status: 500 });
  }
}
