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

    const rows = await service.getSheetData(spreadsheetId, 'EMI_Bills!A:L');
    const items = rows.slice(1)
      .filter(r => r[4] === familyCode)
      .map((row, index) => ({
        title: row[0],
        amount: parseFloat(row[1]) || 0,
        dueDate: row[2],
        status: row[3],
        familyCode: row[4],
        adminEmail: row[5],
        tenure: parseInt(row[6]) || 0,
        monthlyPayment: parseFloat(row[7]) || 0,
        startDate: row[8],
        paidMonths: parseInt(row[9]) || 0,
        type: row[10] || 'EMI',
        owner: row[11] || 'Family',
        id: index + 1
      }));

    return NextResponse.json({ items });

  } catch (error: any) {
    console.error('Error in EMI GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, amount, dueDate, familyCode, tenure, monthlyPayment, startDate, type, owner } = await request.json();
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ items: [] });

    await service.appendRow(spreadsheetId, 'EMI_Bills', [
      title,
      amount,
      dueDate,
      'Unpaid',
      familyCode,
      email,
      tenure || '',
      monthlyPayment || '',
      startDate || '',
      0, // paidMonths
      type || 'EMI',
      owner || 'Family'
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in EMI POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, status, paidMonths, dueDate } = await request.json();
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ items: [] });
    
    const updates = [
      { range: `EMI_Bills!D${id + 1}`, values: [[status]] },
      { range: `EMI_Bills!J${id + 1}`, values: [[paidMonths]] },
      { range: `EMI_Bills!C${id + 1}`, values: [[dueDate]] }
    ];

    for (const update of updates) {
      await service.updateSheetData(spreadsheetId, update.range, update.values);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in EMI PATCH:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
