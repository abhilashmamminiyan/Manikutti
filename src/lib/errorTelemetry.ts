import { GoogleSheetsService } from './googleSheets';

export interface TelemetryErrorInput {
  timestamp?: string;
  source?: 'mobile' | 'web-api' | 'web-ui' | string;
  severity?: 'fatal' | 'error' | 'warn' | string;
  screenOrRoute?: string;
  method?: string;
  httpStatus?: number | string | null;
  message: string;
  stackTraceSnippet?: string;
  userEmail?: string;
  familyCode?: string;
  appVersion?: string;
  buildNumber?: string | number;
  deviceInfo?: string;
}

export interface TelemetryErrorRecord {
  id: string;
  timestamp: string;
  source: string;
  severity: string;
  screenOrRoute: string;
  method: string;
  httpStatus: number | null;
  message: string;
  stackTraceSnippet: string;
  userEmail: string;
  familyCode: string;
  appVersion: string;
  deviceInfo: string;
}

function truncate(val: unknown, maxLen: number): string {
  const s = String(val ?? '').replace(/\r/g, '');
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}...`;
}

function sanitizeMessage(val: unknown): string {
  return truncate(val, 800).replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]');
}

export async function isAdminEmail(email: string): Promise<boolean> {
  try {
    const familySheetId = process.env.FAMILY_SPREADSHEET_ID;
    if (!familySheetId) return false;
    const service = new GoogleSheetsService(email);
    const memberRows = await service.getSheetData(familySheetId, 'Family_Members!A:C');
    const row = memberRows
      .slice(1)
      .find((r) => String(r[1] ?? '').trim().toLowerCase() === email.trim().toLowerCase());
    return String(row?.[2] ?? '').trim().toLowerCase() === 'admin';
  } catch (err) {
    console.error('[ErrorTelemetry] isAdminEmail check failed:', err);
    return false;
  }
}

export async function logErrorTelemetry(entry: TelemetryErrorInput): Promise<void> {
  const adminSheetId = process.env.ADMIN_SPREADSHEET_ID;
  if (!adminSheetId) return;

  try {
    const service = new GoogleSheetsService(entry.userEmail || 'system@manikutti');
    await service.ensureSheetsExist(adminSheetId, 'Admin');

    const versionTag = entry.buildNumber
      ? `${entry.appVersion || 'unknown'}+${entry.buildNumber}`
      : String(entry.appVersion || '');

    await service.appendRow(adminSheetId, 'Error_Logs', [
      entry.timestamp || new Date().toISOString(),
      truncate(entry.source || 'web-api', 32),
      truncate(entry.severity || 'error', 16),
      truncate(entry.screenOrRoute || 'unknown', 200),
      truncate(entry.method || '', 12),
      entry.httpStatus != null ? String(entry.httpStatus) : '',
      sanitizeMessage(entry.message || 'Unknown error'),
      sanitizeMessage(entry.stackTraceSnippet || ''),
      truncate(entry.userEmail || '', 120),
      truncate(entry.familyCode || '', 40),
      truncate(versionTag, 40),
      truncate(entry.deviceInfo || '', 120),
    ]);
  } catch (err) {
    // Telemetry must never crash or fail primary request handlers.
    console.error('[ErrorTelemetry] Failed to persist Error_Logs row:', err);
  }
}

export async function queryErrorTelemetry(options?: {
  limit?: number;
  severity?: string;
  source?: string;
  actorEmail?: string;
}): Promise<TelemetryErrorRecord[]> {
  const adminSheetId = process.env.ADMIN_SPREADSHEET_ID;
  if (!adminSheetId) return [];

  const service = new GoogleSheetsService(options?.actorEmail || 'system@manikutti');
  await service.ensureSheetsExist(adminSheetId, 'Admin');

  const rows = await service.getSheetData(adminSheetId, 'Error_Logs!A:L');
  if (!rows || rows.length <= 1) return [];

  const sevFilter = options?.severity?.trim().toLowerCase();
  const srcFilter = options?.source?.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 250);

  const parsed: TelemetryErrorRecord[] = [];
  for (let i = rows.length - 1; i >= 1; i--) {
    const r = rows[i] || [];
    const statusRaw = String(r[5] ?? '').trim();
    const statusNum = statusRaw ? parseInt(statusRaw, 10) : NaN;

    const record: TelemetryErrorRecord = {
      id: `row_${i + 1}`,
      timestamp: String(r[0] ?? ''),
      source: String(r[1] ?? ''),
      severity: String(r[2] ?? ''),
      screenOrRoute: String(r[3] ?? ''),
      method: String(r[4] ?? ''),
      httpStatus: Number.isFinite(statusNum) ? statusNum : null,
      message: String(r[6] ?? ''),
      stackTraceSnippet: String(r[7] ?? ''),
      userEmail: String(r[8] ?? ''),
      familyCode: String(r[9] ?? ''),
      appVersion: String(r[10] ?? ''),
      deviceInfo: String(r[11] ?? ''),
    };

    if (sevFilter && record.severity.toLowerCase() !== sevFilter) continue;
    if (srcFilter && record.source.toLowerCase() !== srcFilter) continue;

    parsed.push(record);
    if (parsed.length >= limit) break;
  }

  return parsed;
}
