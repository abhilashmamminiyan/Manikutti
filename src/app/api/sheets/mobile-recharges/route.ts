import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

async function resolveSpreadsheet(service: GoogleSheetsService, request: Request, bodySheetType?: string) {
  const url = new URL(request.url);
  const requestedType = url.searchParams.get('sheetType') || bodySheetType;
  const isPersonalRequested = requestedType?.toLowerCase() === 'personal';

  if (isPersonalRequested) {
    try {
      const personalSheetId = await service.findOrCreateSheet('Personal');
      if (personalSheetId) {
        return { spreadsheetId: personalSheetId, type: 'Personal' as const };
      }
    } catch (err) {
      console.warn('[MobileRecharges] Fallback to Family sheet as Personal sheet is unavailable:', err);
    }
  }

  // Admin Dashboard recharges are family-scoped by default
  const familySheetId = await service.findOrCreateSheet('Family');
  return { spreadsheetId: familySheetId, type: 'Family' as const };
}

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new GoogleSheetsService(email);
    const { spreadsheetId } = await resolveSpreadsheet(service, request);
    if (!spreadsheetId) return NextResponse.json({ items: [] });

    const rows = await service.getSheetData(spreadsheetId, 'Mobile_Recharges!A:K');
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ items: [] });
    }

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
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch mobile recharges', details: error?.toString() },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
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
      sheetType,
    } = body;

    const service = new GoogleSheetsService(email);
    const { spreadsheetId, type } = await resolveSpreadsheet(service, request, sheetType);
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

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
      if (type === 'Family') {
        let familyCode = '';
        try {
          const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:B');
          const userRow = members.slice(1).find(m => m[1]?.toLowerCase() === email.toLowerCase());
          if (userRow) familyCode = userRow[0];
        } catch (err) {
          console.warn('Could not retrieve family code for expense logging:', err);
        }

        await service.appendRow(spreadsheetId, 'Family_Expenses', [
          lastRechargedDate,
          planLastRecharged,
          'Recharge',
          `${name} (${operator} - ${phoneNumber}) Mobile Recharge`,
          email,
          familyCode || 'FAM_MAIN',
        ]);
      } else {
        await service.appendRow(spreadsheetId, 'Personal_Expenses', [
          lastRechargedDate,
          planLastRecharged,
          'Recharge',
          `${name} (${operator} - ${phoneNumber}) Mobile Recharge`,
          'TRUE',
          'Expense',
        ]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mobile Recharges POST Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save recharge', details: error?.toString() },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
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
      sheetType,
    } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const service = new GoogleSheetsService(email);
    const { spreadsheetId, type } = await resolveSpreadsheet(service, request, sheetType);
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

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

    if (logExpense && lastRechargedDate && planLastRecharged > 0) {
      if (type === 'Family') {
        let familyCode = '';
        try {
          const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:B');
          const userRow = members.slice(1).find(m => m[1]?.toLowerCase() === email.toLowerCase());
          if (userRow) familyCode = userRow[0];
        } catch (err) {
          console.warn('Could not retrieve family code for expense logging:', err);
        }

        await service.appendRow(spreadsheetId, 'Family_Expenses', [
          lastRechargedDate,
          planLastRecharged,
          'Recharge',
          `${name} (${operator} - ${phoneNumber}) Mobile Recharge`,
          email,
          familyCode || 'FAM_MAIN',
        ]);
      } else {
        await service.appendRow(spreadsheetId, 'Personal_Expenses', [
          lastRechargedDate,
          planLastRecharged,
          'Recharge',
          `${name} (${operator} - ${phoneNumber}) Mobile Recharge`,
          'TRUE',
          'Expense',
        ]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mobile Recharges PUT Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update recharge', details: error?.toString() },
      { status: 500 }
    );
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
    const { spreadsheetId } = await resolveSpreadsheet(service, request);
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    const rowIndex = id + 1; // 1-based index + header
    await service.deleteRow(spreadsheetId, 'Mobile_Recharges', rowIndex);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mobile Recharges DELETE Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete recharge', details: error?.toString() },
      { status: 500 }
    );
  }
}
