import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

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
    const items = rows.slice(1)
      .map((row, index) => ({
        date: String(row[0] ?? '').trim(),
        totalPayment: parseLoanAmount(row[1]),
        principal: parseLoanAmount(row[2]),
        interest: parseLoanAmount(row[3]),
        balance: parseLoanAmount(row[4]),
        familyCode: String(row[5] ?? '').trim(),
        addedBy: String(row[6] ?? '').trim(),
        id: index + 1
      }))
      .filter(r => (r.date || r.totalPayment > 0 || r.familyCode) && normalizeFamilyCode(r.familyCode) === targetCode);

    return NextResponse.json({ items });

  } catch (error: any) {
    console.error('Error in Home Loan GET:', error);
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
    console.error('Error in Home Loan POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, date, totalPayment, principal, interest, balance, familyCode } = await request.json();
    if (id === undefined) return NextResponse.json({ error: 'ID (row index) required' }, { status: 400 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ success: false });

    // The id is the 0-indexed row number in the sheet. So id + 1 is the 1-indexed row number for A1 notation
    const range = `HomeLoan_Ledger!A${id + 1}:G${id + 1}`;
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
    console.error('Error in Home Loan PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    if (!idParam) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const id = parseInt(idParam, 10);
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ success: false });

    // id is the 0-indexed row index
    await service.deleteRow(spreadsheetId, 'HomeLoan_Ledger', id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in Home Loan DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
