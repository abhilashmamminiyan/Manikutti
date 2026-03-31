import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from 'next/server';
import { ManikuttiSession } from '@/lib/types';
import { GoogleSheetsService } from '@/lib/googleSheets';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const lockDir = path.join(process.cwd(), '.locks');
    if (!fs.existsSync(lockDir)) fs.mkdirSync(lockDir);
    
    const lockFile = path.join(lockDir, `init_${session.user?.email?.replace(/[^a-zA-Z0-9]/g, '_')}.lock`);

    // Check for existing lock
    if (fs.existsSync(lockFile)) {
      const stats = fs.statSync(lockFile);
      const now = Date.now();
      // If lock is less than 60 seconds old, wait or return
      if (now - stats.mtimeMs < 60000) {
        return NextResponse.json({ success: true, message: 'Initialization already in progress' });
      }
    }

    try {
      fs.writeFileSync(lockFile, Date.now().toString());

      const service = new GoogleSheetsService(session);
      const spreadsheetId = await service.findOrCreateSheet('Personal');
      
      return NextResponse.json({ success: !!spreadsheetId, spreadsheetId });

    } finally {
      if (fs.existsSync(lockFile)) {
        try { fs.unlinkSync(lockFile); } catch (e) {}
      }
    }

  } catch (error: any) {
    console.error('Error in init GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
