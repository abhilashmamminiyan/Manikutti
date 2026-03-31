import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from 'next/server';
import { ManikuttiSession } from '@/lib/types';
import { GoogleSheetsService, FAMILY_SHEET_PREFIX } from '@/lib/googleSheets';
import { sendInvitationEmail } from '@/lib/email';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    const service = new GoogleSheetsService(session);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ family: null });

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
    console.error('Error in family GET:', error);
    if (error.status === 401 || error.code === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as ManikuttiSession;
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, code, email, name, token } = await request.json();
    const service = new GoogleSheetsService(session);

    if (action === 'create') {
      const spreadsheetId = await service.findOrCreateSheet('Family', name);
      if (!spreadsheetId) return NextResponse.json({ error: 'Failed to create family spreadsheet' }, { status: 500 });
      
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await service.appendRow(spreadsheetId, 'Family_Members', [newCode, session.user?.email, 'Admin', new Date().toISOString()]);
      return NextResponse.json({ success: true, familyCode: newCode });
    }

    if (action === 'join' && code) {
      const allSheets = await service.findAllFamilySheets();
      let targetSpreadsheetId = null;
      let searchedCount = allSheets.length;

      for (const sheet of allSheets) {
        if (!sheet.id) continue;
        try {
          // Range A:B to get both code and email in case we need to check both
          const rows = await service.getSheetData(sheet.id, 'Family_Members!A:B');
          if (rows.some(r => r[0] === code)) {
            targetSpreadsheetId = sheet.id;
            break;
          }
        } catch (e) {
          console.error(`Error checking sheet ${sheet.id}:`, e);
          continue;
        }
      }

      if (!targetSpreadsheetId) {
        const errorMsg = searchedCount === 0 
          ? 'No shared family spreadsheets found. Please ensure the Admin has invited you and you have access to the file.' 
          : `Family code not found among ${searchedCount} discovered spreadsheets.`;
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }

      await service.appendRow(targetSpreadsheetId, 'Family_Members', [code, session.user?.email, 'Member', new Date().toISOString()]);
      return NextResponse.json({ success: true });
    }

    if (action === 'invite') {
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
      
      const spreadsheetId = await service.findOrCreateSheet('Family');
      if (!spreadsheetId) return NextResponse.json({ error: 'Family spreadsheet not found' }, { status: 500 });
      
      // Get the family code
      const rows = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
      const adminRow = rows.slice(1).find(r => r[1] === session.user?.email && r[2] === 'Admin');
      if (!adminRow) return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 });
      
      const familyCode = adminRow[0];
      
      // Fetch the actual spreadsheet name for the email
      const spreadsheet = await service.drive.files.get({
        fileId: spreadsheetId,
        fields: 'name'
      });
      const spreadsheetName = spreadsheet.data.name || 'Family';
      const displayName = spreadsheetName.replace(FAMILY_SHEET_PREFIX, '') || 'Family';

      // Share the spreadsheet first
      const shared = await service.shareSheet(spreadsheetId, email);
      if (!shared) return NextResponse.json({ error: 'Failed to share spreadsheet' }, { status: 500 });

      // Generate token
      const token = jwt.sign(
        { spreadsheetId, familyCode, email },
        process.env.NEXTAUTH_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      // Store invitation
      await service.appendRow(spreadsheetId, 'Invitations', [
        token,
        email,
        familyCode,
        spreadsheetId,
        'Pending',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      ]);

      // Send email
      const inviteLink = `${process.env.NEXTAUTH_URL}/join-family?token=${token}`;
      const emailResult = await sendInvitationEmail(email, displayName, inviteLink);
      
      if (!emailResult.success) {
        return NextResponse.json({ error: 'Invitation sent but email failed. Please share the link manually: ' + inviteLink }, { status: 200 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'accept') {
      if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'secret') as any;
        const { spreadsheetId, familyCode, email } = decoded;

        if (email !== session.user?.email) {
          return NextResponse.json({ error: 'This invitation was sent to another email address.' }, { status: 403 });
        }

        // Check if invitation exists and is pending
        const invitations = await service.getSheetData(spreadsheetId, 'Invitations!A:E');
        const inviteIndex = invitations.findIndex(r => r[0] === token && r[4] === 'Pending');
        
        if (inviteIndex === -1) {
          return NextResponse.json({ error: 'Invitation not found or already accepted' }, { status: 400 });
        }

        // Add to membership
        await service.appendRow(spreadsheetId, 'Family_Members', [familyCode, session.user?.email, 'Member', new Date().toISOString()]);

        // Update invitation status
        invitations[inviteIndex][4] = 'Accepted';
        await service.updateSheetData(spreadsheetId, 'Invitations!A:E', invitations);

        return NextResponse.json({ success: true });

      } catch (err) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in family POST:', error);
    const status = error.status || error.code || error.response?.status;
    if (status === 401 || status === '401') {
      return NextResponse.json({ error: 'Your Google session has expired. Please sign out and sign in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error', details: error.toString() }, { status: 500 });
  }
}
