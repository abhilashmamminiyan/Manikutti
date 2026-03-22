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
    const code = url.searchParams.get('code');

    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet();
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    const rows = await service.getSheetData(spreadsheetId, 'Family_Members!A:D');
    
    if (code) {
      // Find family by code
      const members = rows.slice(1).filter(r => r[0] === code);
      return NextResponse.json({ members, code });
    }

    // Find family by user email
    const userFamily = rows.slice(1).find(r => r[1] === session.user?.email);
    if (!userFamily) return NextResponse.json({ family: null });

    const familyCode = userFamily[0];
    const members = rows.slice(1).filter(r => r[0] === familyCode).map(r => ({
      email: r[1],
      role: r[2],
      joinedDate: r[3]
    }));

    return NextResponse.json({ familyCode, members, role: userFamily[2] });

  } catch (error: any) {
    if (error.status === 401 || error.code === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, code } = await request.json();
    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet();
    if (!spreadsheetId) return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 500 });

    if (action === 'create') {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await service.appendRow(spreadsheetId, 'Family_Members', [newCode, session.user?.email, 'Admin', new Date().toISOString()]);
      return NextResponse.json({ success: true, familyCode: newCode });
    }

    if (action === 'join' && code) {
      const rows = await service.getSheetData(spreadsheetId, 'Family_Members!A:A');
      const exists = rows.some(r => r[0] === code);
      if (!exists) return NextResponse.json({ error: 'Invalid family code' }, { status: 400 });

      await service.appendRow(spreadsheetId, 'Family_Members', [code, session.user?.email, 'Member', new Date().toISOString()]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    if (error.status === 401 || error.code === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
