import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  generateClientSessionToken,
  getAuthUserEmail,
  invalidateUserAuthCache,
  sha256,
} from '@/lib/authHelper';
import { getFirestoreDb } from '@/lib/firebaseAdmin';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { upsertUserRecordInFirestore } from '@/lib/featurePermissions';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ACCESS_CODES_ROW_KEY = '__ACCESS_CODES__';

function generateRandomCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

function normalizeCode(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

interface StoredAccessCodeEntry {
  email: string;
  nickname: string;
  familyCode: string;
  roleName: string;
  accessCodeHash: string;
  accessCodeHint: string;
  accessCodeActive: boolean;
  tokenVersion: number;
  updatedAt: string;
}

async function readSheetAccessCodes(
  service: GoogleSheetsService,
  spreadsheetId: string
): Promise<Record<string, StoredAccessCodeEntry>> {
  try {
    const rows = await service.getSheetData(spreadsheetId, 'Roles_Permissions!A:D');
    const row = rows.slice(1).find((r) => r[0]?.toString().trim() === ACCESS_CODES_ROW_KEY);
    if (!row || !row[1]) return {};
    return JSON.parse(row[1]) as Record<string, StoredAccessCodeEntry>;
  } catch {
    return {};
  }
}

async function saveSheetAccessCodes(
  service: GoogleSheetsService,
  spreadsheetId: string,
  entries: Record<string, StoredAccessCodeEntry>
): Promise<void> {
  const rows = await service.getSheetData(spreadsheetId, 'Roles_Permissions!A:D');
  const idx = rows.findIndex((r, i) => i > 0 && r[0]?.toString().trim() === ACCESS_CODES_ROW_KEY);
  const rowPayload = [ACCESS_CODES_ROW_KEY, JSON.stringify(entries), new Date().toISOString(), 'Member Login Passcodes'];
  if (idx > 0) {
    await service.updateSheetData(spreadsheetId, `Roles_Permissions!A${idx + 1}:D${idx + 1}`, [rowPayload]);
  } else {
    await service.appendRow(spreadsheetId, 'Roles_Permissions', rowPayload);
  }
}

/**
 * Public login using Admin-generated Family Member Access Code (no Email OTP required).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cleanCode = normalizeCode(body?.accessCode || body?.code);
    if (cleanCode.length < 4) {
      return NextResponse.json({ error: 'Please enter a valid family access code.' }, { status: 400 });
    }

    const codeHash = sha256(cleanCode);
    let matched: StoredAccessCodeEntry | null = null;

    // 1. Fast lookup via Firestore
    const db = getFirestoreDb();
    if (db) {
      const snap = await db
        .collection('users')
        .where('accessCodeHash', '==', codeHash)
        .limit(1)
        .get();
      if (!snap.empty) {
        const data = snap.docs[0].data() as Record<string, unknown>;
        matched = {
          email: String(data.email || snap.docs[0].id).trim().toLowerCase(),
          nickname: String(data.nickname || '').trim(),
          familyCode: String(data.familyCode || '').trim(),
          roleName: String(data.roleName || 'Basic').trim(),
          accessCodeHash: String(data.accessCodeHash || ''),
          accessCodeHint: String(data.accessCodeHint || ''),
          accessCodeActive: data.accessCodeActive !== false,
          tokenVersion: typeof data.tokenVersion === 'number' ? data.tokenVersion : 1,
          updatedAt: String(data.updatedAt || ''),
        };
      }
    }

    // 2. Sheet fallback if Firestore unavailable or unindexed
    const service = new GoogleSheetsService('system@manikutti.local');
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!matched && spreadsheetId) {
      const sheetCodes = await readSheetAccessCodes(service, spreadsheetId);
      const found = Object.values(sheetCodes).find((e) => e.accessCodeHash === codeHash);
      if (found) matched = found;
    }

    if (!matched) {
      return NextResponse.json({ error: 'Invalid family access code. Ask your family Admin for a new code.' }, { status: 401 });
    }

    if (!matched.accessCodeActive) {
      return NextResponse.json({ error: 'This access code has been revoked by your family Admin.' }, { status: 403 });
    }

    // Hydrate latest role & nickname from Family_Members if available
    if (spreadsheetId) {
      try {
        const memberRows = await service.getSheetData(spreadsheetId, 'Family_Members!A:G');
        const mRow = memberRows
          .slice(1)
          .find((r) => r[1]?.toString().trim().toLowerCase() === matched!.email.toLowerCase());
        if (mRow) {
          matched.familyCode = mRow[0]?.toString().trim() || matched.familyCode;
          matched.roleName = mRow[2]?.toString().trim() || matched.roleName;
          matched.nickname = mRow[4]?.toString().trim() || matched.nickname;
        }
      } catch {
        // Non-blocking fallback
      }
    }

    const sessionToken = generateClientSessionToken(matched.email, matched.tokenVersion);
    return NextResponse.json({
      success: true,
      email: matched.email,
      nickname: matched.nickname || matched.email.split('@')[0],
      familyCode: matched.familyCode,
      role: matched.roleName || 'Basic',
      sessionToken,
    });
  } catch (error: unknown) {
    console.error('[MemberCode POST] Error:', error);
    return NextResponse.json({ error: 'Failed to verify family code' }, { status: 500 });
  }
}

/**
 * Admin-only: list access code statuses for all family members.
 */
export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ members: [] });

    const memberRows = await service.getSheetData(spreadsheetId, 'Family_Members!A:G');
    const cleanEmail = email.trim().toLowerCase();
    const callerRow = memberRows.slice(1).find((r) => r[1]?.toString().trim().toLowerCase() === cleanEmail);
    if (!callerRow || callerRow[2]?.toString().trim() !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: Only Admins can manage access codes.' }, { status: 403 });
    }

    const familyCode = callerRow[0]?.toString().trim() || '';
    const sheetCodes = await readSheetAccessCodes(service, spreadsheetId);
    const db = getFirestoreDb();

    const familyMembers = memberRows
      .slice(1)
      .filter((r) => r[0]?.toString().trim() === familyCode);

    const members = await Promise.all(
      familyMembers.map(async (r) => {
        const mEmail = (r[1] || '').toString().trim().toLowerCase();
        const role = (r[2] || 'Member').toString().trim();
        const nickname = (r[4] || mEmail.split('@')[0]).toString().trim();
        let entry = sheetCodes[mEmail];
        if (!entry && db) {
          try {
            const snap = await db.collection('users').doc(mEmail).get();
            if (snap.exists) {
              const d = snap.data() as Record<string, unknown>;
              if (d.accessCodeHash) {
                entry = {
                  email: mEmail,
                  nickname,
                  familyCode,
                  roleName: role,
                  accessCodeHash: String(d.accessCodeHash),
                  accessCodeHint: String(d.accessCodeHint || ''),
                  accessCodeActive: d.accessCodeActive !== false,
                  tokenVersion: typeof d.tokenVersion === 'number' ? d.tokenVersion : 1,
                  updatedAt: String(d.updatedAt || ''),
                };
              }
            }
          } catch {
            // ignore
          }
        }
        return {
          email: mEmail,
          nickname,
          role,
          familyCode,
          hasCode: Boolean(entry?.accessCodeHash),
          active: entry ? entry.accessCodeActive : false,
          codeHint: entry?.accessCodeHint || '',
          updatedAt: entry?.updatedAt || '',
        };
      })
    );

    return NextResponse.json({ familyCode, members });
  } catch (error: unknown) {
    console.error('[MemberCode GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load member access codes' }, { status: 500 });
  }
}

/**
 * Admin-only: add member without email OTP, generate/regenerate/set custom code, or revoke access.
 */
export async function PUT(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const action = String(body?.action || 'generate');
    const customCode = normalizeCode(body?.customCode);
    const requestedNickname = String(body?.nickname || '').trim();
    const requestedRole = String(body?.roleName || 'Basic').trim() || 'Basic';
    let targetEmail = String(body?.targetEmail || '').trim().toLowerCase();

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Family spreadsheet not found' }, { status: 404 });

    const memberRows = await service.getSheetData(spreadsheetId, 'Family_Members!A:G');
    const cleanCaller = email.trim().toLowerCase();
    const callerRow = memberRows.slice(1).find((r) => r[1]?.toString().trim().toLowerCase() === cleanCaller);
    if (!callerRow || callerRow[2]?.toString().trim() !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: Only Admins can manage access codes.' }, { status: 403 });
    }
    const familyCode = callerRow[0]?.toString().trim() || '';

    // Allow Admin to quick-add a family member by name (e.g., Nisha / Ajesh) without email verification
    if (action === 'addMemberAndCode') {
      if (!requestedNickname) {
        return NextResponse.json({ error: 'Member name is required' }, { status: 400 });
      }
      if (!targetEmail) {
        const slug = requestedNickname.toLowerCase().replace(/[^a-z0-9]+/g, '');
        targetEmail = `${slug || 'member'}@family.local`;
      }
      const existing = memberRows
        .slice(1)
        .find((r) => r[0]?.toString().trim() === familyCode && r[1]?.toString().trim().toLowerCase() === targetEmail);
      if (!existing) {
        await service.appendRow(spreadsheetId, 'Family_Members', [
          familyCode,
          targetEmail,
          requestedRole,
          new Date().toISOString(),
          requestedNickname,
          '0',
          '0',
        ]);
      }
    }

    if (!targetEmail) {
      return NextResponse.json({ error: 'targetEmail is required' }, { status: 400 });
    }

    const refreshedRows =
      action === 'addMemberAndCode'
        ? await service.getSheetData(spreadsheetId, 'Family_Members!A:G')
        : memberRows;
    const targetRow = refreshedRows
      .slice(1)
      .find((r) => r[0]?.toString().trim() === familyCode && r[1]?.toString().trim().toLowerCase() === targetEmail);
    if (!targetRow) {
      return NextResponse.json({ error: 'Member not found in family' }, { status: 404 });
    }

    const nickname = requestedNickname || targetRow[4]?.toString().trim() || targetEmail.split('@')[0];
    const roleName = targetRow[2]?.toString().trim() || requestedRole;
    const sheetCodes = await readSheetAccessCodes(service, spreadsheetId);
    const prevVersion = sheetCodes[targetEmail]?.tokenVersion || 1;
    const nextVersion = prevVersion + 1;

    if (action === 'revoke') {
      const revokedEntry: StoredAccessCodeEntry = {
        email: targetEmail,
        nickname,
        familyCode,
        roleName,
        accessCodeHash: '',
        accessCodeHint: 'Revoked',
        accessCodeActive: false,
        tokenVersion: nextVersion,
        updatedAt: new Date().toISOString(),
      };
      sheetCodes[targetEmail] = revokedEntry;
      await saveSheetAccessCodes(service, spreadsheetId, sheetCodes);
      await upsertUserRecordInFirestore(targetEmail, {
        nickname,
        familyCode,
        roleName,
        accessCodeHash: '',
        accessCodeHint: 'Revoked',
        accessCodeActive: false,
        tokenVersion: nextVersion,
      });
      invalidateUserAuthCache(targetEmail);
      return NextResponse.json({ success: true, revoked: true, email: targetEmail });
    }

    if (action === 'setCustom' && customCode.length < 4) {
      return NextResponse.json({ error: 'Custom passcode must be at least 4 characters.' }, { status: 400 });
    }

    const plaintextCode = customCode.length >= 4 ? customCode : generateRandomCode(6);
    const codeHash = sha256(plaintextCode);
    const codeHint =
      plaintextCode.length <= 4
        ? '••••'
        : `${'•'.repeat(plaintextCode.length - 2)}${plaintextCode.slice(-2)}`;

    const entry: StoredAccessCodeEntry = {
      email: targetEmail,
      nickname,
      familyCode,
      roleName,
      accessCodeHash: codeHash,
      accessCodeHint: codeHint,
      accessCodeActive: true,
      tokenVersion: nextVersion,
      updatedAt: new Date().toISOString(),
    };
    sheetCodes[targetEmail] = entry;
    await saveSheetAccessCodes(service, spreadsheetId, sheetCodes);
    await upsertUserRecordInFirestore(targetEmail, {
      nickname,
      familyCode,
      roleName,
      accessCodeHash: codeHash,
      accessCodeHint: codeHint,
      accessCodeActive: true,
      tokenVersion: nextVersion,
    });
    invalidateUserAuthCache(targetEmail);

    const origin = new URL(request.url).origin;
    const inviteDeepLink = `manikutti://join?code=${encodeURIComponent(plaintextCode)}`;
    const inviteWebLink = `${origin}/join-family?code=${encodeURIComponent(plaintextCode)}`;

    return NextResponse.json({
      success: true,
      email: targetEmail,
      nickname,
      roleName,
      code: plaintextCode,
      codeHint,
      inviteDeepLink,
      inviteWebLink,
    });
  } catch (error: unknown) {
    console.error('[MemberCode PUT] Error:', error);
    return NextResponse.json({ error: 'Failed to update access code' }, { status: 500 });
  }
}
