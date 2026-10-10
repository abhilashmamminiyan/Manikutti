import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ items: [] });

    const rows = await service.getSheetData(spreadsheetId, 'Mobile_Recharges!A:K');
    const items = rows.slice(1).map((row, index) => ({
      id: index + 1,
      name: row[0] || '',
      phoneNumber: row[1] || '',
      operator: row[2] || 'Other',
      planLastRecharged: parseFloat(row[3]) || 0,
      planDescription: row[4] || '',
      validityTill: row[5] || '',
      lastRechargedDate: row[6] || '',
      reminderDaysBefore: parseInt(row[7], 10) || 1,
      notifyExpiry: row[8] === 'true' || row[8] === 'TRUE',
      note: row[9] || '',
      logExpense: row[10] === 'true' || row[10] === 'TRUE',
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Mobile Recharges GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      name,
      phoneNumber,
      operator,
      planLastRecharged,
      planDescription,
      validityTill,
      lastRechargedDate,
      reminderDaysBefore,
      notifyExpiry,
      note,
      logExpense,
    } = await request.json();

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    await service.appendRow(spreadsheetId, 'Mobile_Recharges', [
      name || '',
      phoneNumber || '',
      operator || 'Other',
      planLastRecharged || 0,
      planDescription || '',
      validityTill || '',
      lastRechargedDate || '',
      reminderDaysBefore ?? 1,
      notifyExpiry ? 'TRUE' : 'FALSE',
      note || '',
      logExpense ? 'TRUE' : 'FALSE',
    ]);

    if (logExpense && lastRechargedDate && planLastRecharged > 0) {
      await service.appendRow(spreadsheetId, 'Personal_Expenses', [
        lastRechargedDate,
        planLastRecharged,
        'Recharge',
        `${name} (${operator} - ${phoneNumber}) Mobile Recharge`,
        'TRUE',
        'Expense',
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mobile Recharges POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      id,
      name,
      phoneNumber,
      operator,
      planLastRecharged,
      planDescription,
      validityTill,
      lastRechargedDate,
      reminderDaysBefore,
      notifyExpiry,
      note,
      logExpense,
    } = await request.json();

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    const rowIndex = id + 1; // 1-based index + header
    await service.updateRow(spreadsheetId, `Mobile_Recharges!A${rowIndex}:K${rowIndex}`, [
      name || '',
      phoneNumber || '',
      operator || 'Other',
      planLastRecharged || 0,
      planDescription || '',
      validityTill || '',
      lastRechargedDate || '',
      reminderDaysBefore ?? 1,
      notifyExpiry ? 'TRUE' : 'FALSE',
      note || '',
      logExpense ? 'TRUE' : 'FALSE',
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mobile Recharges PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '', 10);
    if (!id) return NextResponse.json({ error: 'Valid ID required' }, { status: 400 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    const rows = await service.getSheetData(spreadsheetId, 'Mobile_Recharges!A:K');
    const filteredRows = rows.filter((_, index) => index !== id);

    await service.clearSheet(spreadsheetId, 'Mobile_Recharges!A:K');
    if (filteredRows.length > 0) {
      await service.updateRow(spreadsheetId, `Mobile_Recharges!A1:K${filteredRows.length}`, filteredRows);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mobile Recharges DELETE Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
