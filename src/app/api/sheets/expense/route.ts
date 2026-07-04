import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const sheetName = url.searchParams.get('sheetName') || 'Personal_Expenses';

    const service = new GoogleSheetsService(email);
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
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sheetName, expense, familyCode } = await request.json();
    const service = new GoogleSheetsService(email);
    const type = sheetName === 'Family_Expenses' ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(type);
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    if (sheetName === 'Family_Expenses') {
      // Admin Check
      let members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
      const isAdminEmail = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase());

      if (members.length <= 1 && isAdminEmail) {
        const defaultFamilyCode = `FAM_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const defaultNickname = email.split('@')[0];
        const joinedDate = new Date().toISOString().split('T')[0];
        
        await service.appendRow(spreadsheetId, 'Family_Members', [
          defaultFamilyCode,
          email,
          'Admin',
          joinedDate,
          defaultNickname,
          '0'
        ]);
        
        // Re-fetch members
        members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
      }

      const userRow = members.slice(1).find(m => m[1]?.toLowerCase() === email.toLowerCase());
      
      if (!userRow) {
        return NextResponse.json({ error: 'Forbidden: You are not a member of this family group' }, { status: 403 });
      }

      const rowData = [
        expense.date || new Date().toISOString(),
        expense.amount,
        expense.category,
        expense.note || '',
        email,
        familyCode || ''
      ];
      await service.appendRow(spreadsheetId, 'Family_Expenses', rowData);
    } else {
      const rowData = [
        expense.date || new Date().toISOString(),
        expense.amount,
        expense.category,
        expense.note || '',
        expense.isPaid !== undefined ? expense.isPaid : true,
        expense.type || 'Expense'
      ];
      await service.appendRow(spreadsheetId, 'Personal_Expenses', rowData);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in expense POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, sheetName, isPaid } = await request.json();
    if (id === undefined || !sheetName || isPaid === undefined) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });

    const service = new GoogleSheetsService(email);
    const type = sheetName === 'Family_Expenses' ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(type);
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    const rowIndex = id + 1; // Row 1 is header, index 0 in GET's slice(1) is row 2
    const range = `${sheetName}!E${rowIndex}`;

    await service.updateRow(spreadsheetId, range, [isPaid]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in expense PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, sheetName, date, amount, category, note } = await request.json();
    if (id === undefined || !sheetName || !date || amount === undefined || !category) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const service = new GoogleSheetsService(email);
    const type = sheetName === 'Family_Expenses' ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(type);
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    // Admin Check for Family Expenses
    if (sheetName === 'Family_Expenses') {
      const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
      const memberRow = members.slice(1).find(m => m[1]?.toLowerCase() === email.toLowerCase());
      if (!memberRow || memberRow[2] !== 'Admin') {
        return NextResponse.json({ error: 'Only Admins can update family expenses' }, { status: 403 });
      }
    }

    const rowIndex = id + 1; // row index in sheet is id + 1

    // Updates: Date (col A), Amount (col B), Category (col C), Note (col D)
    const updates = [
      { range: `${sheetName}!A${rowIndex}`, values: [[date]] },
      { range: `${sheetName}!B${rowIndex}`, values: [[amount]] },
      { range: `${sheetName}!C${rowIndex}`, values: [[category]] },
      { range: `${sheetName}!D${rowIndex}`, values: [[note || '']] }
    ];

    for (const update of updates) {
      await service.updateSheetData(spreadsheetId, update.range, update.values);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Expense PUT Error:', error);
    return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const idStr = url.searchParams.get('id');
    const sheetName = url.searchParams.get('sheetName');
    if (!idStr || !sheetName) return NextResponse.json({ error: 'ID and sheetName parameters required' }, { status: 400 });
    const id = parseInt(idStr);

    const service = new GoogleSheetsService(email);
    const type = sheetName === 'Family_Expenses' ? 'Family' : 'Personal';
    const spreadsheetId = await service.findOrCreateSheet(type);
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    // Admin Check for Family Expenses
    if (sheetName === 'Family_Expenses') {
      const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
      const memberRow = members.slice(1).find(m => m[1]?.toLowerCase() === email.toLowerCase());
      if (!memberRow || memberRow[2] !== 'Admin') {
        return NextResponse.json({ error: 'Only Admins can delete family expenses' }, { status: 403 });
      }
    }

    const rowIndex = id + 1; // row index in sheet is id + 1
    await service.deleteRow(spreadsheetId, sheetName, rowIndex);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Expense DELETE Error:', error);
    return NextResponse.json({ error: 'Delete failed', details: error.message }, { status: 500 });
  }
}
