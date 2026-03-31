import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from 'next/server';
import { ManikuttiSession } from '@/lib/types';
import { GoogleSheetsService } from '@/lib/googleSheets';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ categories: [] });

    const rows = await service.getSheetData(spreadsheetId, 'Settings!A:B');
    const categories = rows.slice(1).map(row => row[0]).filter(Boolean);
    const incomeCategories = rows.slice(1).map(row => row[1]).filter(Boolean);

    return NextResponse.json({ 
      categories: categories.length > 0 ? categories : ['Food', 'Housing', 'Transport', 'Leisure', 'Health', 'Shopping', 'Investment'],
      incomeCategories: incomeCategories.length > 0 ? incomeCategories : ['Salary', 'Kadam', 'Investment', 'Other']
    });
  } catch (error: any) {
    if (error.status === 401 || error.code === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { categories, incomeCategories } = await request.json();
    
    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet('Personal');
    if (!spreadsheetId) return NextResponse.json({ categories: [] });

    // Format for sheet update (A1:B100)
    // We need to zip the two arrays or handle them separately. 
    // Managing them in one call is better.
    const maxLen = Math.max(categories?.length || 0, incomeCategories?.length || 0);
    const values: any[][] = [['Categories', 'Income Categories']];
    
    for (let i = 0; i < maxLen; i++) {
      values.push([
        categories?.[i] || '',
        incomeCategories?.[i] || ''
      ]);
    }

    // Clear and update
    await service.clearRange(spreadsheetId, 'Settings!A1:B100');
    await service.updateSheetData(spreadsheetId, 'Settings!A1', values);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
