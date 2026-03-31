import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from 'next/server';
import { ManikuttiSession } from '@/lib/types';
import { GoogleSheetsService } from '@/lib/googleSheets';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const familyCode = url.searchParams.get('familyCode');
    if (!familyCode) return NextResponse.json({ error: 'Family code required' }, { status: 400 });

    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ items: [] });

    const rows = await service.getSheetData(spreadsheetId, 'Monthly_Expenses!A:H');
    const items = rows.slice(1)
      .filter(r => r[4] === familyCode)
      .map((row, index) => ({
        title: row[0],
        amount: parseFloat(row[1]) || 0,
        dueDay: parseInt(row[2]) || 1,
        status: row[3],
        familyCode: row[4],
        adminEmail: row[5],
        lastPaidDate: row[6],
        lastPaidBy: row[7],
        id: index + 1
      }));

    return NextResponse.json({ items });

  } catch (error: any) {
    console.error('Monthly GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, amount, dueDay, familyCode } = await request.json();
    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    // Admin Check
    const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
    const userRole = members.slice(1).find(m => m[0] === familyCode && m[1] === session.user?.email)?.[2];
    
    if (userRole !== 'Admin') {
      return NextResponse.json({ error: 'Only Admins can add monthly expenses' }, { status: 403 });
    }

    await service.appendRow(spreadsheetId, 'Monthly_Expenses', [
      title,
      amount,
      dueDay,
      'Unpaid',
      familyCode,
      session.user?.email,
      '', // lastPaidDate
      ''  // lastPaidBy
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Monthly POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, paidDate } = await request.json();
    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });
    
    // Update status (col D), lastPaidDate (col G), and lastPaidBy (col H)
    const updates = [
      { range: `Monthly_Expenses!D${id + 1}`, values: [['Paid']] },
      { range: `Monthly_Expenses!G${id + 1}`, values: [[paidDate]] },
      { range: `Monthly_Expenses!H${id + 1}`, values: [[session.user?.email]] }
    ];

    for (const update of updates) {
      await service.updateSheetData(spreadsheetId, update.range, update.values);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Monthly PATCH Error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
