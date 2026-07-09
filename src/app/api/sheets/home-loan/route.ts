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

    const rows = await service.getSheetData(spreadsheetId, 'HomeLoan_Ledger!A:G');
    const items = rows.slice(1)
      .filter(r => r[5] === familyCode)
      .map((row, index) => ({
        date: row[0],
        totalPayment: parseFloat(row[1]) || 0,
        principal: parseFloat(row[2]) || 0,
        interest: parseFloat(row[3]) || 0,
        balance: parseFloat(row[4]) || 0,
        familyCode: row[5],
        addedBy: row[6],
        id: index + 1
      }));

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
