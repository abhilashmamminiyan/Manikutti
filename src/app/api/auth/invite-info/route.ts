import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'secret') as any;
    return NextResponse.json({
      email: decoded.email,
      familyCode: decoded.familyCode,
      personalSpreadsheetId: decoded.personalSpreadsheetId
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 400 });
  }
}
