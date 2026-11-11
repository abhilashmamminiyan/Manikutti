import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { getAuthUserEmail } from '@/lib/authHelper';
import {
  FEATURE_CATALOG,
  getFamilyRolesConfig,
  normalizePermissions,
  resolveEffectivePermissions,
  saveFamilyRolesConfig,
  upsertUserRecordInFirestore,
} from '@/lib/featurePermissions';

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Family spreadsheet not found' }, { status: 404 });
    }

    const memberRows = await service.getSheetData(spreadsheetId, 'Family_Members!A:G');
    const cleanEmail = email.trim().toLowerCase();
    const callerRow = memberRows.slice(1).find((r) => r[1]?.toString().trim().toLowerCase() === cleanEmail);

    if (!callerRow) {
      return NextResponse.json({ joinedFamily: false, featureCatalog: FEATURE_CATALOG, roles: [], aiEnabled: true });
    }

    const familyCode = callerRow[0]?.toString().trim() || '';
    const myRole = callerRow[2]?.toString().trim() || 'Member';
    const config = await getFamilyRolesConfig(service, spreadsheetId, familyCode);
    const myPermissions = resolveEffectivePermissions(config, myRole);

    return NextResponse.json({
      joinedFamily: true,
      familyCode,
      myRole,
      aiEnabled: config.aiEnabled,
      myPermissions,
      roles: Object.values(config.roles),
      featureCatalog: FEATURE_CATALOG,
    });
  } catch (error: unknown) {
    console.error('[Roles API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load roles', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, roleName, description, permissions, aiEnabled, targetEmail } = body;

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Family spreadsheet not found' }, { status: 404 });
    }

    const memberRows = await service.getSheetData(spreadsheetId, 'Family_Members!A:G');
    const cleanEmail = email.trim().toLowerCase();
    const callerRow = memberRows.slice(1).find((r) => r[1]?.toString().trim().toLowerCase() === cleanEmail);

    if (!callerRow || callerRow[2]?.toString().trim() !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: Only Admins can manage roles & feature permissions.' }, { status: 403 });
    }

    const familyCode = callerRow[0]?.toString().trim() || '';
    const config = await getFamilyRolesConfig(service, spreadsheetId, familyCode);

    if (action === 'toggleAi') {
      config.aiEnabled = Boolean(aiEnabled);
      await saveFamilyRolesConfig(service, spreadsheetId, familyCode, config);
      return NextResponse.json({
        success: true,
        aiEnabled: config.aiEnabled,
        roles: Object.values(config.roles),
      });
    }

    if (action === 'upsertRole') {
      const cleanName = (roleName || '').toString().trim();
      if (!cleanName || cleanName.startsWith('__')) {
        return NextResponse.json({ error: 'Valid role name is required' }, { status: 400 });
      }
      const existing = config.roles[cleanName];
      config.roles[cleanName] = {
        roleName: cleanName,
        description: (description ?? existing?.description ?? 'Custom family role').toString().trim(),
        isSystem: Boolean(existing?.isSystem),
        permissions: normalizePermissions(permissions, existing ? false : true),
      };
      await saveFamilyRolesConfig(service, spreadsheetId, familyCode, config);
      return NextResponse.json({
        success: true,
        role: config.roles[cleanName],
        roles: Object.values(config.roles),
      });
    }

    if (action === 'assignMemberRole') {
      const cleanTarget = (targetEmail || '').toString().trim().toLowerCase();
      const cleanRole = (roleName || '').toString().trim();
      if (!cleanTarget || !cleanRole) {
        return NextResponse.json({ error: 'targetEmail and roleName are required' }, { status: 400 });
      }
      if (!config.roles[cleanRole]) {
        return NextResponse.json({ error: `Role "${cleanRole}" does not exist` }, { status: 400 });
      }

      const rowIndex = memberRows.findIndex(
        (r, idx) => idx > 0 && r[0]?.toString().trim() === familyCode && r[1]?.toString().trim().toLowerCase() === cleanTarget
      );
      if (rowIndex === -1) {
        return NextResponse.json({ error: 'Member not found in family' }, { status: 404 });
      }

      // Guard: prevent removing the last Admin
      const currentRole = memberRows[rowIndex][2]?.toString().trim();
      if (currentRole === 'Admin' && cleanRole !== 'Admin') {
        const adminCount = memberRows
          .slice(1)
          .filter((r) => r[0]?.toString().trim() === familyCode && r[2]?.toString().trim() === 'Admin').length;
        if (adminCount <= 1) {
          return NextResponse.json({ error: 'Cannot remove the last family Admin' }, { status: 400 });
        }
      }

      memberRows[rowIndex][2] = cleanRole;
      await service.updateSheetData(spreadsheetId, 'Family_Members!A:G', memberRows);
      await upsertUserRecordInFirestore(cleanTarget, { familyCode, roleName: cleanRole });

      return NextResponse.json({ success: true, targetEmail: cleanTarget, roleName: cleanRole });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('[Roles API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update roles', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const roleName = (url.searchParams.get('roleName') || '').trim();
    if (!roleName) return NextResponse.json({ error: 'roleName is required' }, { status: 400 });

    const service = new GoogleSheetsService(email);
    const spreadsheetId = await service.findOrCreateSheet('Family');
    if (!spreadsheetId) return NextResponse.json({ error: 'Family spreadsheet not found' }, { status: 404 });

    const memberRows = await service.getSheetData(spreadsheetId, 'Family_Members!A:G');
    const cleanEmail = email.trim().toLowerCase();
    const callerRow = memberRows.slice(1).find((r) => r[1]?.toString().trim().toLowerCase() === cleanEmail);
    if (!callerRow || callerRow[2]?.toString().trim() !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const familyCode = callerRow[0]?.toString().trim() || '';
    const config = await getFamilyRolesConfig(service, spreadsheetId, familyCode);
    const targetRole = config.roles[roleName];
    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    if (targetRole.isSystem) {
      return NextResponse.json({ error: 'Built-in system roles cannot be deleted' }, { status: 400 });
    }

    delete config.roles[roleName];
    await saveFamilyRolesConfig(service, spreadsheetId, familyCode, config);

    // Reassign any members holding deleted role back to 'Member'
    let changed = false;
    for (let i = 1; i < memberRows.length; i++) {
      if (memberRows[i][0]?.toString().trim() === familyCode && memberRows[i][2]?.toString().trim() === roleName) {
        memberRows[i][2] = 'Member';
        changed = true;
        const mEmail = memberRows[i][1]?.toString().trim().toLowerCase();
        if (mEmail) {
          await upsertUserRecordInFirestore(mEmail, { familyCode, roleName: 'Member' });
        }
      }
    }
    if (changed) {
      await service.updateSheetData(spreadsheetId, 'Family_Members!A:G', memberRows);
    }

    return NextResponse.json({ success: true, roles: Object.values(config.roles) });
  } catch (error: unknown) {
    console.error('[Roles API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete role', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
