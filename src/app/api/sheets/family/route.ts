import { NextResponse } from 'next/server';
import { GoogleSheetsService, FAMILY_SHEET_PREFIX } from '@/lib/googleSheets';
import { sendInvitationEmail } from '@/lib/email';
import { getAuthUserEmail } from '@/lib/authHelper';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ family: null });

    const rows = await service.getSheetData(spreadsheetId, 'Family_Members!A:F');
    
    if (code) {
      // Find family by code
      const members = rows.slice(1).filter(r => r[0] === code);
      return NextResponse.json({ members, code });
    }

    // Find family by user email
    const userFamily = rows.slice(1).find(r => r[1]?.toLowerCase() === email.toLowerCase());
    if (!userFamily) return NextResponse.json({ family: null });

    const familyCode = userFamily[0];
    const members = rows.slice(1).filter(r => r[0] === familyCode).map(r => ({
      email: r[1],
      role: r[2],
      joinedDate: r[3],
      nickname: r[4] || '',
      monthlyIncome: parseFloat(r[5]) || 0
    }));

    return NextResponse.json({ familyCode, members, role: userFamily[2] });

  } catch (error: unknown) {
    console.error('Error in family GET:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, code, email: targetInviteEmail, name, token, targetEmail, nickname, monthlyIncome } = body;
    const service = new GoogleSheetsService(email);

    if (action === 'create') {
      const spreadsheetId = await service.findOrCreateSheet('Family', name);
      if (!spreadsheetId) return NextResponse.json({ error: 'Failed to find family spreadsheet' }, { status: 500 });
      
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await service.appendRow(spreadsheetId, 'Family_Members', [newCode, email, 'Admin', new Date().toISOString()]);
      return NextResponse.json({ success: true, familyCode: newCode });
    }

    if (action === 'join' && code) {
      const spreadsheetId = await service.findOrCreateSheet('Family');
      if (!spreadsheetId) return NextResponse.json({ error: 'Family spreadsheet not found' }, { status: 500 });

      const rows = await service.getSheetData(spreadsheetId, 'Family_Members!A:B');
      const codeExists = rows.some(r => r[0] === code);

      if (!codeExists) {
        return NextResponse.json({ error: 'Family code not found in the Admin Spreadsheet' }, { status: 400 });
      }

      await service.appendRow(spreadsheetId, 'Family_Members', [code, email, 'Member', new Date().toISOString()]);
      return NextResponse.json({ success: true });
    }

    if (action === 'invite') {
      if (!targetInviteEmail) return NextResponse.json({ error: 'Email required' }, { status: 400 });
      
      const spreadsheetId = await service.findOrCreateSheet('Family');
      if (!spreadsheetId) return NextResponse.json({ error: 'Family spreadsheet not found' }, { status: 500 });
      
      // Get the family code
      const rows = await service.getSheetData(spreadsheetId, 'Family_Members!A:C');
      const adminRow = rows.slice(1).find(r => r[1]?.toLowerCase() === email.toLowerCase() && r[2] === 'Admin');
      if (!adminRow) return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 });
      
      const familyCode = adminRow[0];
      
      // Retrieve spreadsheet name (mock or fallback since we don't query drive file names on client token)
      const displayName = name || 'Family';

      // Share the spreadsheet first
      const shared = await service.shareSheet(spreadsheetId, targetInviteEmail);
      if (!shared) return NextResponse.json({ error: 'Failed to share spreadsheet with invitee' }, { status: 500 });

      // Generate token
      const token = jwt.sign(
        { spreadsheetId, familyCode, email: targetInviteEmail },
        process.env.NEXTAUTH_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      // Store invitation
      await service.appendRow(spreadsheetId, 'Invitations', [
        token,
        targetInviteEmail,
        familyCode,
        spreadsheetId,
        'Pending',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      ]);

      // Send email
      const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/join-family?token=${token}`;
      const emailResult = await sendInvitationEmail(targetInviteEmail, displayName, inviteLink);
      
      if (!emailResult.success) {
        return NextResponse.json({ error: 'Invitation sent but email failed. Please share the link manually: ' + inviteLink }, { status: 200 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'accept') {
      if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'secret') as any;
        const { spreadsheetId: inviteSpreadsheetId, familyCode, email: inviteeEmail } = decoded;

        if (inviteeEmail?.toLowerCase() !== email.toLowerCase()) {
          return NextResponse.json({ error: 'This invitation was sent to another email address.' }, { status: 403 });
        }

        const spreadsheetId = await service.findOrCreateSheet('Family');
        if (!spreadsheetId) {
          return NextResponse.json({ error: 'Family spreadsheet not found' }, { status: 500 });
        }
        
        // Check if invitation exists and is pending
        const invitations = await service.getSheetData(spreadsheetId, 'Invitations!A:E');
        const inviteIndex = invitations.findIndex(r => r[0] === token && r[4] === 'Pending');
        
        if (inviteIndex === -1) {
          return NextResponse.json({ error: 'Invitation not found or already accepted' }, { status: 400 });
        }

        // Add to membership
        await service.appendRow(spreadsheetId, 'Family_Members', [familyCode, email, 'Member', new Date().toISOString()]);

        // Update invitation status
        invitations[inviteIndex][4] = 'Accepted';
        await service.updateSheetData(spreadsheetId, 'Invitations!A:E', invitations);

        return NextResponse.json({ success: true });

      } catch (err) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
      }
    }

    if (action === 'updateMember') {
      const spreadsheetId = await service.findOrCreateSheet('Family');
      if (!spreadsheetId) return NextResponse.json({ error: 'Family spreadsheet not found' }, { status: 500 });

      const rows = await service.getSheetData(spreadsheetId, 'Family_Members!A:F');
      const rowIndex = rows.findIndex(r => r[1]?.toLowerCase() === targetEmail?.toLowerCase());
      if (rowIndex === -1) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

      // Ensure row has enough columns
      while (rows[rowIndex].length < 6) rows[rowIndex].push('');
      
      rows[rowIndex][4] = nickname || '';
      rows[rowIndex][5] = (monthlyIncome || 0).toString();

      await service.updateSheetData(spreadsheetId, 'Family_Members!A:F', rows);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: unknown) {
    console.error('Error in family POST:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error', details: String(error) }, { status: 500 });
  }
}
