import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const lockDir = path.join(process.cwd(), '.locks');
    if (!fs.existsSync(lockDir)) fs.mkdirSync(lockDir);
    
    const lockFile = path.join(lockDir, `init_${email.replace(/[^a-zA-Z0-9]/g, '_')}.lock`);

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

      const service = new GoogleSheetsService(email);
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
