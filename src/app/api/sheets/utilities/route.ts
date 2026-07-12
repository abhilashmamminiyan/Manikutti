import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

function addValidity(dateStr: string, validityStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const parts = validityStr.trim().split(' ');
  if (parts.length >= 2) {
    const amount = parseInt(parts[0], 10);
    const unit = parts[1].toLowerCase();
    
    if (!isNaN(amount)) {
      if (unit.includes('month')) {
        d.setMonth(d.getMonth() + amount);
      } else if (unit.includes('day')) {
        d.setDate(d.getDate() + amount);
      } else if (unit.includes('year')) {
        d.setFullYear(d.getFullYear() + amount);
      }
    }
  }
  return d.toISOString();
}

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ items: [] });

    const rows = await service.getSheetData(spreadsheetId, 'Personal_Utilities!A:H');
    const items = rows.slice(1).map((row, index) => ({
      title: row[0] || '',
      amount: parseFloat(row[1]) || 0,
      validity: row[2] || '',
      status: row[3] || 'Active',
      lastPaidDate: row[4] || '',
      nextDueDate: row[5] || '',
      note: row[6] || '',
      logExpense: row[7] === 'true' || row[7] === 'TRUE',
      id: index + 1
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Utilities GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, amount, validity, status, lastPaidDate, note, logExpense } = await request.json();
    
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    const nextDueDate = addValidity(lastPaidDate, validity);

    await service.appendRow(spreadsheetId, 'Personal_Utilities', [
      title,
      amount,
      validity,
      status || 'Active',
      lastPaidDate,
      nextDueDate,
      note || '',
      logExpense ? 'TRUE' : 'FALSE'
    ]);

    if (logExpense && lastPaidDate) {
      // Also log to Personal_Expenses
      await service.appendRow(spreadsheetId, 'Personal_Expenses', [
        lastPaidDate,
        amount,
        'Utility',
        `${title} - Utility Recharge`,
        'TRUE',
        'Expense'
      ]);
    }

    return NextResponse.json({ success: true, nextDueDate });
  } catch (error: any) {
    console.error('Utilities POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // This handles marking as "Paid"
    const { id, paidDate, logExpense } = await request.json();
    if (id === undefined) return NextResponse.json({ error: 'ID parameter required' }, { status: 400 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    const allRows = await service.getSheetData(spreadsheetId, 'Personal_Utilities!A:H');
    const rowIndex = id;
    const item = allRows[rowIndex];
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const title = item[0];
    const amount = parseFloat(item[1]) || 0;
    const validity = item[2];
    const shouldLogExpense = logExpense !== undefined ? logExpense : (item[7] === 'TRUE' || item[7] === 'true');

    const nextDueDate = addValidity(paidDate || new Date().toISOString(), validity);

    const sheetRowIndex = id + 1; // since id is 1-based index from GET, wait: index+1 was returned as id.
    // Let's verify the GET method: id: index + 1. So if index is 0 (row 2), id is 1. sheetRowIndex is id + 1 (2).
    
    const updates = [
      { range: `Personal_Utilities!E${sheetRowIndex}`, values: [[paidDate || new Date().toISOString()]] },
      { range: `Personal_Utilities!F${sheetRowIndex}`, values: [[nextDueDate]] }
    ];

    for (const update of updates) {
      await service.updateSheetData(spreadsheetId, update.range, update.values);
    }

    if (shouldLogExpense) {
      await service.appendRow(spreadsheetId, 'Personal_Expenses', [
        paidDate || new Date().toISOString(),
        amount,
        'Utility',
        `${title} - Utility Recharge`,
        'TRUE',
        'Expense'
      ]);
    }

    return NextResponse.json({ success: true, nextDueDate });
  } catch (error: any) {
    console.error('Utilities PATCH Error:', error);
    return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, title, amount, validity, status, lastPaidDate, nextDueDate, note, logExpense } = await request.json();
    if (id === undefined) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    const rowIndex = id + 1; // row index in sheet

    const updates = [
      { range: `Personal_Utilities!A${rowIndex}`, values: [[title]] },
      { range: `Personal_Utilities!B${rowIndex}`, values: [[amount]] },
      { range: `Personal_Utilities!C${rowIndex}`, values: [[validity]] },
      { range: `Personal_Utilities!D${rowIndex}`, values: [[status]] },
      { range: `Personal_Utilities!E${rowIndex}`, values: [[lastPaidDate]] },
      { range: `Personal_Utilities!F${rowIndex}`, values: [[nextDueDate]] },
      { range: `Personal_Utilities!G${rowIndex}`, values: [[note || '']] },
      { range: `Personal_Utilities!H${rowIndex}`, values: [[logExpense ? 'TRUE' : 'FALSE']] }
    ];

    for (const update of updates) {
      await service.updateSheetData(spreadsheetId, update.range, update.values);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Utilities PUT Error:', error);
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
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    const rowIndex = id + 1; 
    await service.deleteRow(spreadsheetId, 'Personal_Utilities', rowIndex);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Utilities DELETE Error:', error);
    return NextResponse.json({ error: 'Delete failed', details: error.message }, { status: 500 });
  }
}
