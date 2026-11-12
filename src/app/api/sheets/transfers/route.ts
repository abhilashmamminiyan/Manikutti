import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';
import { sendFcmToUsers } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const familyCode = url.searchParams.get('familyCode')?.trim();
    if (!familyCode) return NextResponse.json({ error: 'Family code required' }, { status: 400 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ items: [] });

    const rows = await service.getSheetData(spreadsheetId, 'Family_Transfers!A:H');
    const targetCode = familyCode.toUpperCase();

    const items = rows
      .slice(1)
      .map((row, idx) => ({
        id: idx + 1,
        date: String(row[0] ?? '').trim(),
        fromMember: String(row[1] ?? '').trim(),
        toMember: String(row[2] ?? '').trim(),
        amount: parseFloat(String(row[3] ?? '0')) || 0,
        note: String(row[4] ?? '').trim(),
        familyCode: String(row[5] ?? '').trim(),
        addedBy: String(row[6] ?? '').trim(),
        status: String(row[7] ?? 'Completed').trim() || 'Completed',
      }))
      .filter((r) => r.familyCode.toUpperCase() === targetCode && r.amount > 0);

    return NextResponse.json({ items });
  } catch (error: unknown) {
    console.error('[Transfers GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load family transfers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { date, fromMember, toMember, amount, note, familyCode, status } = body;

    const amtNum = typeof amount === 'number' ? amount : parseFloat(String(amount ?? '0'));
    if (!familyCode || !fromMember || !toMember || Number.isNaN(amtNum) || amtNum <= 0) {
      return NextResponse.json({ error: 'fromMember, toMember, positive amount, and familyCode are required' }, { status: 400 });
    }

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Family spreadsheet not found' }, { status: 404 });

    const members = await service.getSheetData(spreadsheetId, 'Family_Members!A:E');
    const cleanEmail = email.trim().toLowerCase();
    const callerRow = members.slice(1).find((m) => m[1]?.toString().trim().toLowerCase() === cleanEmail);
    if (!callerRow) {
      return NextResponse.json({ error: 'Forbidden: You are not a member of this family' }, { status: 403 });
    }

    const activeFamilyCode = String(familyCode || callerRow[0] || '').trim();
    const txDate = String(date || new Date().toISOString());

    await service.appendRow(spreadsheetId, 'Family_Transfers', [
      txDate,
      String(fromMember).trim(),
      String(toMember).trim(),
      amtNum,
      String(note || '').trim(),
      activeFamilyCode,
      email,
      String(status || 'Completed').trim(),
    ]);

    const otherMemberEmails = members
      .slice(1)
      .filter((m) => m[0]?.toString().trim() === activeFamilyCode)
      .map((m) => m[1]?.toString().trim().toLowerCase())
      .filter((mEmail) => Boolean(mEmail) && mEmail !== cleanEmail);

    if (otherMemberEmails.length > 0) {
      await sendFcmToUsers(otherMemberEmails, {
        title: `Family Transfer: ₹${amtNum.toLocaleString('en-IN')}`,
        body: `${fromMember} → ${toMember}${note ? ` (${note})` : ''}`,
        channelId: 'payment_channel',
        data: {
          type: 'family_transfer',
          familyCode: activeFamilyCode,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[Transfers POST] Error:', error);
    return NextResponse.json({ error: 'Failed to record transfer' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const idStr = url.searchParams.get('id');
    if (!idStr) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const id = parseInt(idStr, 10);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Family spreadsheet not found' }, { status: 404 });

    await service.deleteRow(spreadsheetId, 'Family_Transfers', id + 1);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[Transfers DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete transfer' }, { status: 500 });
  }
}
