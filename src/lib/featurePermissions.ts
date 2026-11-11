import { FieldValue } from 'firebase-admin/firestore';
import { getFirestoreDb } from '@/lib/firebaseAdmin';
import type { GoogleSheetsService } from '@/lib/googleSheets';

export const FEATURE_KEYS = [
  'home_loan',
  'loans_emi_ledger',
  'monthly_dues',
  'bills_utilities',
  'mobile_recharges',
  'smart_scan',
  'screenshots',
  'bank_statement',
  'voice_logging',
  'ai_screenshot_extraction',
  'ai_advisor',
  'budget_progress',
  'expense_chart',
  'bank_balances',
  'salary_tracking',
  'family_ledger',
  'family_goals',
  'about_app',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type PermissionsMap = Record<FeatureKey, boolean>;

export interface FeatureMeta {
  key: FeatureKey;
  label: string;
  description: string;
  group: 'Dashboard Cards' | 'Modules & Tools' | 'AI & Automation';
}

export const FEATURE_CATALOG: FeatureMeta[] = [
  // Dashboard Cards
  {
    key: 'budget_progress',
    label: 'Monthly Budget Progress',
    description: 'Spending vs. budget gauge on the mobile home screen.',
    group: 'Dashboard Cards',
  },
  {
    key: 'expense_chart',
    label: 'Expense Analytics Chart',
    description: 'Weekly & category breakdown chart on the dashboard.',
    group: 'Dashboard Cards',
  },
  {
    key: 'bank_balances',
    label: 'Bank Balances Card',
    description: 'Per-account balance chips and net worth cards.',
    group: 'Dashboard Cards',
  },
  {
    key: 'salary_tracking',
    label: 'Salary & Income Editor',
    description: 'View and edit personal monthly salary & Day 4/5 alerts.',
    group: 'Dashboard Cards',
  },
  {
    key: 'home_loan',
    label: 'Home Loan Tracker',
    description: 'Home loan principal/interest progress card and detailed ledger.',
    group: 'Dashboard Cards',
  },
  {
    key: 'loans_emi_ledger',
    label: 'Family Loans & EMIs Card',
    description: 'Unified active loans & monthly EMI commitments card.',
    group: 'Dashboard Cards',
  },
  {
    key: 'monthly_dues',
    label: 'Monthly Family Dues',
    description: 'Recurring rent, utilities, and EMI dues reminders.',
    group: 'Dashboard Cards',
  },
  // Modules & Tools
  {
    key: 'family_ledger',
    label: 'Family Ledger & Hub',
    description: 'Shared family expenses & family sync status banner.',
    group: 'Modules & Tools',
  },
  {
    key: 'family_goals',
    label: 'Family Goals (Lakshyam)',
    description: 'Shared family savings goals and milestone progress.',
    group: 'Modules & Tools',
  },
  {
    key: 'bills_utilities',
    label: 'Bills & Utilities',
    description: 'Periodic utility bills tracker and due reminders.',
    group: 'Modules & Tools',
  },
  {
    key: 'mobile_recharges',
    label: 'Mobile Recharges',
    description: 'SIM validity & prepaid plan expiry tracker.',
    group: 'Modules & Tools',
  },
  {
    key: 'screenshots',
    label: 'Payment Screenshots Log',
    description: 'Receive shared WhatsApp/GPay images and scan screenshot gallery.',
    group: 'Modules & Tools',
  },
  {
    key: 'smart_scan',
    label: 'Smart Scan (Camera/Gallery)',
    description: 'Quick receipt capture using on-device OCR.',
    group: 'Modules & Tools',
  },
  {
    key: 'bank_statement',
    label: 'Bank Statement Import',
    description: 'Bulk CSV/PDF bank statement parser and importer.',
    group: 'Modules & Tools',
  },
  {
    key: 'about_app',
    label: 'About App Info Page',
    description: 'App version & feature showcase drawer entry.',
    group: 'Modules & Tools',
  },
  // AI & Automation
  {
    key: 'ai_screenshot_extraction',
    label: 'AI Screenshot Extraction',
    description: 'Use free Gemini Flash Lite to extract amount, category & note from shared screenshots. When disabled, uses 100% offline ML Kit OCR + local regex.',
    group: 'AI & Automation',
  },
  {
    key: 'ai_advisor',
    label: 'AI Financial Advisor',
    description: 'AI goal motivation & spending insights.',
    group: 'AI & Automation',
  },
  {
    key: 'voice_logging',
    label: 'Voice Expense Logging',
    description: 'Speak expenses hands-free from Quick Access.',
    group: 'AI & Automation',
  },
];

export interface RoleDefinition {
  roleName: string;
  description: string;
  isSystem?: boolean;
  permissions: PermissionsMap;
}

export interface FamilyRolesConfig {
  aiEnabled: boolean;
  roles: Record<string, RoleDefinition>;
}

export function createPermissionsMap(defaultVal: boolean, overrides: Partial<PermissionsMap> = {}): PermissionsMap {
  const map = {} as PermissionsMap;
  for (const key of FEATURE_KEYS) {
    map[key] = overrides[key] !== undefined ? Boolean(overrides[key]) : defaultVal;
  }
  return map;
}

export function normalizePermissions(raw: Partial<Record<string, unknown>> | null | undefined, fallbackVal = true): PermissionsMap {
  const map = {} as PermissionsMap;
  for (const key of FEATURE_KEYS) {
    const val = raw?.[key];
    map[key] = typeof val === 'boolean' ? val : fallbackVal;
  }
  return map;
}

export function buildDefaultRolesConfig(): FamilyRolesConfig {
  return {
    aiEnabled: true,
    roles: {
      Admin: {
        roleName: 'Admin',
        description: 'Full access to all dashboard cards, loans, AI tools, and family controls.',
        isSystem: true,
        permissions: createPermissionsMap(true),
      },
      Partner: {
        roleName: 'Partner',
        description: 'Household partner view with loans, home loan, shared dues, goals, and screenshot logging.',
        isSystem: true,
        permissions: createPermissionsMap(true),
      },
      Member: {
        roleName: 'Member',
        description: 'Balanced view with personal balances, family ledger, bills, goals, and screenshot extraction.',
        isSystem: true,
        permissions: createPermissionsMap(true, {
          home_loan: false,
          loans_emi_ledger: false,
          bank_statement: false,
          ai_advisor: false,
        }),
      },
      Basic: {
        roleName: 'Basic',
        description: 'Minimal clutter-free experience: manual expense entry + screenshot sharing only.',
        isSystem: true,
        permissions: createPermissionsMap(false, {
          screenshots: true,
          smart_scan: true,
          ai_screenshot_extraction: true,
          family_ledger: true,
        }),
      },
    },
  };
}

export interface FirestoreUserRecord {
  email: string;
  googleDriveId?: string;
  familyCode?: string;
  roleName?: string;
  fcmTokens?: string[];
  updatedAt?: string;
}

export async function getUserRecordFromFirestore(email: string): Promise<FirestoreUserRecord | null> {
  const db = getFirestoreDb();
  if (!db || !email) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const snap = await db.collection('users').doc(cleanEmail).get();
    if (!snap.exists) return null;
    return snap.data() as FirestoreUserRecord;
  } catch (err) {
    console.error(`[FeaturePermissions] Firestore getUser error for ${cleanEmail}:`, err);
    return null;
  }
}

export async function upsertUserRecordInFirestore(
  email: string,
  fields: Partial<FirestoreUserRecord>
): Promise<void> {
  const db = getFirestoreDb();
  if (!db || !email) return;
  const cleanEmail = email.trim().toLowerCase();
  try {
    await db.collection('users').doc(cleanEmail).set(
      {
        email: cleanEmail,
        ...fields,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error(`[FeaturePermissions] Firestore upsertUser error for ${cleanEmail}:`, err);
  }
}

export async function registerUserFcmToken(email: string, token: string): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db || !email || !token) return false;
  const cleanEmail = email.trim().toLowerCase();
  try {
    await db.collection('users').doc(cleanEmail).set(
      {
        email: cleanEmail,
        fcmTokens: FieldValue.arrayUnion(token.trim()),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error(`[FeaturePermissions] Failed saving FCM token for ${cleanEmail}:`, err);
    return false;
  }
}

const FAMILY_SETTINGS_ROW_KEY = '__FAMILY_SETTINGS__';

export async function getFamilyRolesConfig(
  service: GoogleSheetsService,
  familySpreadsheetId: string,
  familyCode: string
): Promise<FamilyRolesConfig> {
  const defaults = buildDefaultRolesConfig();
  const db = getFirestoreDb();

  // 1. Try Firestore first (source of truth when configured)
  if (db && familyCode) {
    try {
      const snap = await db.collection('families').doc(familyCode).get();
      if (snap.exists) {
        const data = snap.data() || {};
        const aiEnabled = typeof data.aiEnabled === 'boolean' ? data.aiEnabled : true;
        const storedRoles = (data.roles || {}) as Record<string, Partial<RoleDefinition>>;
        const mergedRoles: Record<string, RoleDefinition> = {};

        for (const [key, defRole] of Object.entries(defaults.roles)) {
          const override = storedRoles[key];
          mergedRoles[key] = {
            roleName: key,
            description: override?.description || defRole.description,
            isSystem: true,
            permissions: override?.permissions
              ? normalizePermissions(override.permissions, true)
              : defRole.permissions,
          };
        }
        for (const [key, customRole] of Object.entries(storedRoles)) {
          if (!mergedRoles[key] && key !== FAMILY_SETTINGS_ROW_KEY) {
            mergedRoles[key] = {
              roleName: key,
              description: customRole.description || 'Custom family role',
              isSystem: false,
              permissions: normalizePermissions(customRole.permissions, false),
            };
          }
        }
        return { aiEnabled, roles: mergedRoles };
      }
    } catch (err) {
      console.error(`[FeaturePermissions] Firestore read family ${familyCode} error:`, err);
    }
  }

  // 2. Fallback to Google Sheets Roles_Permissions tab
  try {
    await service.ensureSheetsExist(familySpreadsheetId, 'Family');
    const rows = await service.getSheetData(familySpreadsheetId, 'Roles_Permissions!A:D');
    if (rows.length > 1) {
      let aiEnabled = true;
      const roles: Record<string, RoleDefinition> = { ...defaults.roles };
      for (const r of rows.slice(1)) {
        const roleName = r[0]?.toString().trim();
        if (!roleName) continue;
        if (roleName === FAMILY_SETTINGS_ROW_KEY) {
          try {
            const parsedSettings = JSON.parse(r[1]?.toString() || '{}');
            if (typeof parsedSettings.aiEnabled === 'boolean') {
              aiEnabled = parsedSettings.aiEnabled;
            }
          } catch {
            // ignore malformed JSON
          }
          continue;
        }
        try {
          const parsedPerms = JSON.parse(r[1]?.toString() || '{}');
          roles[roleName] = {
            roleName,
            description: r[3]?.toString() || roles[roleName]?.description || 'Custom family role',
            isSystem: Boolean(roles[roleName]?.isSystem),
            permissions: normalizePermissions(parsedPerms, roleName === 'Admin' || roleName === 'Partner'),
          };
        } catch {
          // ignore malformed row
        }
      }
      const config = { aiEnabled, roles };
      // Backfill Firestore silently if connected
      if (db && familyCode) {
        db.collection('families').doc(familyCode).set(config, { merge: true }).catch(() => {});
      }
      return config;
    }
  } catch (err) {
    console.error('[FeaturePermissions] Sheets Roles_Permissions read failed:', err);
  }

  // 3. Seed defaults into Firestore/Sheets cleanly
  await saveFamilyRolesConfig(service, familySpreadsheetId, familyCode, defaults);
  return defaults;
}

export async function saveFamilyRolesConfig(
  service: GoogleSheetsService,
  familySpreadsheetId: string,
  familyCode: string,
  config: FamilyRolesConfig
): Promise<void> {
  const db = getFirestoreDb();
  const payload = {
    aiEnabled: config.aiEnabled,
    roles: config.roles,
    updatedAt: new Date().toISOString(),
  };

  if (db && familyCode) {
    try {
      await db.collection('families').doc(familyCode).set(payload, { merge: true });
    } catch (err) {
      console.error(`[FeaturePermissions] Firestore write family ${familyCode} failed:`, err);
    }
  }

  try {
    await service.ensureSheetsExist(familySpreadsheetId, 'Family');
    const sheetRows: string[][] = [
      ['Role Name', 'Permissions JSON', 'Updated At', 'Description'],
      [
        FAMILY_SETTINGS_ROW_KEY,
        JSON.stringify({ aiEnabled: config.aiEnabled }),
        payload.updatedAt,
        'Global family feature toggles',
      ],
    ];
    for (const role of Object.values(config.roles)) {
      sheetRows.push([
        role.roleName,
        JSON.stringify(role.permissions),
        payload.updatedAt,
        role.description || '',
      ]);
    }
    await service.clearRange(familySpreadsheetId, 'Roles_Permissions!A:D');
    await service.updateSheetData(familySpreadsheetId, 'Roles_Permissions!A:D', sheetRows);
  } catch (err) {
    console.error('[FeaturePermissions] Failed saving Roles_Permissions to Sheets:', err);
  }
}

export function resolveEffectivePermissions(
  config: FamilyRolesConfig,
  roleName: string
): PermissionsMap {
  const targetRole =
    config.roles[roleName] ||
    config.roles[
      Object.keys(config.roles).find(
        (k) => k.toLowerCase() === (roleName || 'Member').trim().toLowerCase()
      ) || 'Member'
    ] ||
    buildDefaultRolesConfig().roles.Member;

  const resolved: PermissionsMap = { ...targetRole.permissions };
  if (!config.aiEnabled) {
    resolved.ai_screenshot_extraction = false;
    resolved.ai_advisor = false;
  }
  return resolved;
}
