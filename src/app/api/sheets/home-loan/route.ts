import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';
import { logErrorTelemetry } from '@/lib/errorTelemetry';

function reportHomeLoanFailure(method: string, error: any) {
  console.error(`Error in Home Loan ${method}:`, error);
  void logErrorTelemetry({
    source: 'web-api',
    severity: 'error',
    screenOrRoute: '/api/sheets/home-loan',
    method,
    httpStatus: 500,
    message: error?.message || String(error),
    stackTraceSnippet: error?.stack || '',
  });
}

function parseLoanAmount(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const cleaned = String(val ?? '').replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeFamilyCode(val: unknown): string {
  return String(val ?? '').trim().toUpperCase();
}

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const familyCode = url.searchParams.get('familyCode')?.trim();
    if (!familyCode) return NextResponse.json({ error: 'Family code required' }, { status: 400 });

    const targetCode = normalizeFamilyCode(familyCode);
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ items: [] });

    const rows = await service.getSheetData(spreadsheetId, 'HomeLoan_Ledger!A:G');
    const hasHeader = String(rows[0]?.[0] ?? '').trim().toLowerCase() === 'date';
    const startIdx = hasHeader ? 1 : 0;

    const items = rows.slice(startIdx)
      .map((row, idx) => {
        const sheetZeroIdx = idx + startIdx;
        return {
          date: String(row[0] ?? '').trim(),
          totalPayment: parseLoanAmount(row[1]),
          principal: parseLoanAmount(row[2]),
          interest: parseLoanAmount(row[3]),
          balance: parseLoanAmount(row[4]),
          familyCode: String(row[5] ?? '').trim(),
          addedBy: String(row[6] ?? '').trim(),
          id: sheetZeroIdx
        };
      })
      .filter(r => (r.date || r.totalPayment > 0 || r.familyCode) && normalizeFamilyCode(r.familyCode) === targetCode);

    return NextResponse.json({ items });

  } catch (error: any) {
    reportHomeLoanFailure('GET', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { date, totalPayment, principal, interest, balance, familyCode } = await request.json();
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ items: [] });

    await service.appendRow(spreadsheetId, 'HomeLoan_Ledger', [
      date,
      totalPayment,
      principal,
      interest,
      balance,
      familyCode,
      email
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    reportHomeLoanFailure('POST', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, date, totalPayment, principal, interest, balance, familyCode } = await request.json();
    if (id === undefined) return NextResponse.json({ error: 'ID (row index) required' }, { status: 400 });

    const rowIdx = typeof id === 'number' ? id : parseInt(String(id), 10);
    if (!Number.isInteger(rowIdx) || rowIdx < 0) {
      return NextResponse.json({ error: 'Valid row ID required' }, { status: 400 });
    }

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ success: false });

    const existingRows = await service.getSheetData(spreadsheetId, 'HomeLoan_Ledger!A:G');
    const hasHeader = String(existingRows[0]?.[0] ?? '').trim().toLowerCase() === 'date';
    if (hasHeader && rowIdx < 1) {
      return NextResponse.json({ error: 'Cannot overwrite header row' }, { status: 400 });
    }

    // rowIdx is 0-indexed in sheet values; A1 notation is 1-indexed (rowIdx + 1)
    const range = `HomeLoan_Ledger!A${rowIdx + 1}:G${rowIdx + 1}`;
    await service.updateRow(spreadsheetId, range, [
      date,
      totalPayment,
      principal,
      interest,
      balance,
      familyCode,
      email
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    reportHomeLoanFailure('PUT', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    const expectedDate = url.searchParams.get('date')?.trim();
    if (!idParam) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const id = parseInt(idParam, 10);
    if (!Number.isInteger(id) || id < 0) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ success: false });

    const rows = await service.getSheetData(spreadsheetId, 'HomeLoan_Ledger!A:G');
    const hasHeader = String(rows[0]?.[0] ?? '').trim().toLowerCase() === 'date';
    if (hasHeader && id < 1) {
      return NextResponse.json({ error: 'Cannot delete header row' }, { status: 400 });
    }
    if (id >= rows.length) {
      return NextResponse.json({ error: 'Entry not found (sheet changed, please refresh)' }, { status: 404 });
    }
    if (expectedDate && String(rows[id]?.[0] ?? '').trim() !== expectedDate) {
      return NextResponse.json({ error: 'Entry mismatch (please refresh and retry)' }, { status: 409 });
    }

    // id is the 0-indexed sheet row index; deleteRow expects 1-indexed A1 row number
    await service.deleteRow(spreadsheetId, 'HomeLoan_Ledger', id + 1);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    reportHomeLoanFailure('DELETE', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
