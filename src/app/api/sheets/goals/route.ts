import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ goals: [] });

    const rows = await service.getSheetData(spreadsheetId, 'Goals!A:E');
    const goals = rows.slice(1)
      .filter(r => r[4]?.toLowerCase() === email.toLowerCase())
      .map((row, index) => ({
        title: row[0],
        targetAmount: parseFloat(row[1]) || 0,
        currentAmount: parseFloat(row[2]) || 0,
        status: row[3],
        userEmail: row[4],
        id: index + 1
      }));

    return NextResponse.json({ goals });

  } catch (error: any) {
    console.error('Error in goals GET:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, targetAmount, currentAmount } = await request.json();
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ goals: [] });

    await service.appendRow(spreadsheetId, 'Goals', [
      title,
      targetAmount,
      currentAmount || 0,
      'Active',
      email
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in goals POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, currentAmount } = await request.json();
    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ goals: [] });
    
    // Update currentAmount in column C (index 2)
    await service.updateRow(spreadsheetId, `Goals!C${id + 1}`, [currentAmount]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in goals PATCH:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
