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
    if (!spreadsheetId) return NextResponse.json({ items: [] });

    const rows = await service.getSheetData(spreadsheetId, 'Monthly_Expenses!A:J');
    const items = rows.slice(1)
      .map((row, index) => ({
        title: row[0],
        amount: parseFloat(row[1]) || 0,
        dueDay: parseInt(row[2]) || 1,
        status: row[3],
        familyCode: row[4],
        adminEmail: row[5],
        lastPaidDate: row[6] || '',
        lastPaidBy: row[7] || '',
        linkedLoan: row[8] || '',
        assignedTo: row[9] || 'Family',
        id: index + 1
      }))
      .filter(r => r.familyCode === familyCode);

    return NextResponse.json({ items });

  } catch (error: any) {
    console.error('Monthly GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, amount, dueDay, familyCode, assignedTo } = await request.json();
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    // Admin Check
    const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
    const userRole = members.slice(1).find(m => m[0] === familyCode && m[1]?.toLowerCase() === email.toLowerCase())?.[2];
    
    if (userRole !== 'Admin') {
      return NextResponse.json({ error: 'Only Admins can add monthly expenses' }, { status: 403 });
    }

    await service.appendRow(spreadsheetId, 'Monthly_Expenses', [
      title,
      amount,
      dueDay,
      'Unpaid',
      familyCode,
      email,
      '', // lastPaidDate
      '', // lastPaidBy
      '', // Linked Loan
      assignedTo || 'Family' // Column J
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Monthly POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, paidDate } = await request.json();
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });
    
    // Fetch all rows
    const allRows = await service.getSheetData(spreadsheetId, 'Monthly_Expenses!A:J');
    const item = allRows[id]; 
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const assignedTo = item[9];
    if (assignedTo && assignedTo !== 'Family' && assignedTo?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: `Only the assigned user (${assignedTo}) can mark this as paid.` }, { status: 403 });
    }

    const linkedLoanName = item[8];
    if (linkedLoanName) {
      const loansRows = await service.getSheetData(spreadsheetId, 'Loans!A:G');
      const loan = loansRows.find(r => r[0] === linkedLoanName);
      if (loan) {
        const loanAssignedTo = loan[3];
        if (loanAssignedTo && loanAssignedTo?.toLowerCase() !== email.toLowerCase()) {
          return NextResponse.json({ error: 'Only the assigned user can mark this loan as paid.' }, { status: 403 });
        }
        
        // Record in Loan_Repayments
        await service.appendRow(spreadsheetId, 'Loan_Repayments', [
          paidDate || new Date().toISOString(),
          item[1], // Amount
          linkedLoanName,
          email,
          item[4] // Family Code
        ]);
      }
    }

    // Fetch User Nickname
    const memberRows = await service.getSheetData(spreadsheetId, 'Family_Members!A:F');
    const currentUser = memberRows.slice(1).find(r => r[1]?.toLowerCase() === email.toLowerCase());
    const displayName = currentUser?.[4] || email;

    // Update status (col D), lastPaidDate (col G), and lastPaidBy (col H)
    const updates = [
      { range: `Monthly_Expenses!D${id + 1}`, values: [['Paid']] },
      { range: `Monthly_Expenses!G${id + 1}`, values: [[paidDate]] },
      { range: `Monthly_Expenses!H${id + 1}`, values: [[displayName]] }
    ];

    for (const update of updates) {
      await service.updateSheetData(spreadsheetId, update.range, update.values);
    }

    // Log Notification Row
    try {
      await service.appendRow(spreadsheetId, 'Notifications', [
        new Date().toISOString(),
        'Payment Confirmation',
        `${displayName} paid the ${item[0]} (₹${parseFloat(item[1]).toLocaleString()})`,
        item[4],
        'payment',
        email
      ]);
    } catch (e) {
      console.error('Failed to append payment notification:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Monthly PATCH Error:', error);
    return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, title, amount, dueDay, assignedTo } = await request.json();
    if (id === undefined || !title || amount === undefined || dueDay === undefined) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    // Admin Check
    const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
    const memberRow = members.slice(1).find(m => m[1]?.toLowerCase() === email.toLowerCase());
    if (!memberRow || memberRow[2] !== 'Admin') {
      return NextResponse.json({ error: 'Only Admins can update monthly expenses' }, { status: 403 });
    }

    const rowIndex = id + 1; // row index in sheet is id + 1
    
    // Updates ranges in Monthly_Expenses: Title (col A), Amount (col B), Due Day (col C), Assigned To (col J)
    const updates = [
      { range: `Monthly_Expenses!A${rowIndex}`, values: [[title]] },
      { range: `Monthly_Expenses!B${rowIndex}`, values: [[amount]] },
      { range: `Monthly_Expenses!C${rowIndex}`, values: [[dueDay]] },
      { range: `Monthly_Expenses!J${rowIndex}`, values: [[assignedTo || 'Family']] }
    ];

    for (const update of updates) {
      await service.updateSheetData(spreadsheetId, update.range, update.values);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Monthly PUT Error:', error);
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
      return NextResponse.json({ error: 'Only Admins can delete monthly expenses' }, { status: 403 });
    }

    const rowIndex = id + 1; // row index in sheet is id + 1
    await service.deleteRow(spreadsheetId, 'Monthly_Expenses', rowIndex);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Monthly DELETE Error:', error);
    return NextResponse.json({ error: 'Delete failed', details: error.message }, { status: 500 });
  }
}
