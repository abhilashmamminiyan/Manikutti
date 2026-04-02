import { google, sheets_v4, drive_v3 } from 'googleapis';
import { ManikuttiSession } from './types';

export const PERSONAL_SHEET_NAME = 'Manikutti_v2_Personal';
export const FAMILY_SHEET_PREFIX = 'Manikutti_v2_Family_';

export class GoogleSheetsService {
  private session: ManikuttiSession;
  private sheets: sheets_v4.Sheets;
  private drive: drive_v3.Drive;
  private auth: InstanceType<typeof google.auth.OAuth2>;

  constructor(session: ManikuttiSession) {
    if (!session?.accessToken) {
      console.error('[GoogleSheetsService] Missing access token in session');
      throw new Error('Google access token not found in session.');
    }
    this.session = session;
    console.log(`[GoogleSheetsService] Initializing with access token (length: ${session.accessToken.length}, prefix: ${session.accessToken.substring(0, 5)})`);
    
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId) console.warn('[GoogleSheetsService] GOOGLE_CLIENT_ID is missing');
    if (!clientSecret) console.warn('[GoogleSheetsService] GOOGLE_CLIENT_SECRET is missing');

    this.auth = new google.auth.OAuth2(clientId, clientSecret);
    this.auth.setCredentials({ access_token: session.accessToken });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  public async findAllFamilySheets(): Promise<{id: string, name: string}[]> {
    try {
      console.log('[GoogleSheetsService] findAllFamilySheets: fetching list');
      const response = await this.drive.files.list({
        auth: this.auth,
        q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
        fields: 'files(id, name, owners)',
        pageSize: 50,
      });
      
      const allFiles = response.data.files || [];
      console.log(`[GoogleSheetsService] findAllFamilySheets: Total spreadsheets found: ${allFiles.length}`);
      allFiles.forEach(f => console.log(`[GoogleSheetsService] Found file: "${f.name}" (ID: ${f.id})`));

      const filtered = allFiles
        .filter(f => f.name && (f.name.includes(FAMILY_SHEET_PREFIX) || (f.name.includes('Family') && f.name.includes('Manikutti'))))
        .map(f => ({ id: f.id!, name: f.name! }));

      return filtered;
    } catch (error: unknown) {
      console.error('[GoogleSheetsService] Error in findAllFamilySheets:', error instanceof Error ? error.message : String(error));
      // @ts-expect-error - checking for common API error properties
      if (error?.code === 401 || error?.status === 401) {
        throw new Error('UNAUTHORIZED_GOOGLE_ACCESS');
      }
      throw error;
    }
  }

  private async checkMembership(spreadsheetId: string, email: string): Promise<boolean> {
    try {
      const rows = await this.getSheetData(spreadsheetId, 'Family_Members!B:B');
      const normalizedEmail = email.trim().toLowerCase();
      const isMember = rows.slice(1).some(r => r[0]?.toString().trim().toLowerCase() === normalizedEmail);
      console.log(`[GoogleSheetsService] Checking membership for ${normalizedEmail} in ${spreadsheetId}: ${isMember}`);
      return isMember;
    } catch (error) {
      console.error(`[GoogleSheetsService] Membership check failed for ${spreadsheetId}:`, error);
      return false;
    }
  }

  public async findOrCreateSheet(type: 'Personal' | 'Family', familyName?: string): Promise<string | null> {
      const userEmail = this.session.user?.email;
      const targetName = type === 'Personal' ? PERSONAL_SHEET_NAME : `${FAMILY_SHEET_PREFIX}${familyName || 'Shared'}`;
      console.log(`[GoogleSheetsService] findOrCreateSheet type=${type} familyName=${familyName} userEmail=${userEmail}`);
      
      if (type === 'Family') {
        for (let retry = 0; retry < 3; retry++) {
          const familyFiles = await this.findAllFamilySheets();
          console.log(`[GoogleSheetsService] Found ${familyFiles.length} family-prefixed files (Retry ${retry})`);
          if (familyFiles.length > 0 && userEmail) {
            for (const file of familyFiles) {
              console.log(`[GoogleSheetsService] Checking family file: ${file.name} (${file.id})`);
              if (await this.checkMembership(file.id, userEmail)) {
                await this.ensureSheetsExist(file.id, 'Family');
                return file.id;
              }
            }
          }
          if (familyName) break; 
          await new Promise(resolve => setTimeout(resolve, 1000 + (retry * 500)));
        }
        console.log(`[GoogleSheetsService] No family sheet found for ${userEmail}`);
        if (!familyName) return null;
      } else {
        const query = `mimeType='application/vnd.google-apps.spreadsheet' and name='${targetName}' and trashed=false`;
        let response = await this.drive.files.list({
          auth: this.auth,
          q: query,
          fields: 'files(id, name, owners)',
        });
        let files = response.data.files || [];

        if (files.length === 0) {
          for (let i = 0; i < 2; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            response = await this.drive.files.list({ 
              auth: this.auth,
              q: query, 
              fields: 'files(id, name, owners)' 
            });
            files = response.data.files || [];
            if (files.length > 0) break;
          }
        }

        if (files.length > 0) {
          const ownedFile = files.find(f => f.owners?.some(o => o.emailAddress === userEmail)) || files[0];
          await this.ensureSheetsExist(ownedFile.id!, 'Personal');
          return ownedFile.id!;
        }
      }

      const delay = type === 'Personal' ? Math.floor(Math.random() * 2000) : Math.floor(Math.random() * 500);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const secondResponse = await this.drive.files.list({
        auth: this.auth,
        q: `mimeType='application/vnd.google-apps.spreadsheet' and name='${targetName}' and trashed=false`,
        fields: 'files(id, owners, createdTime)',
        orderBy: 'createdTime desc'
      });
      const secondFiles = secondResponse.data.files || [];
      
      if (secondFiles.length > 0) {
        if (type === 'Personal') {
          const ownedFile = secondFiles.find(f => f.owners?.some(o => o.emailAddress === userEmail)) || secondFiles[0];
          await this.ensureSheetsExist(ownedFile.id!, 'Personal');
          return ownedFile.id!;
        } else {
          await this.ensureSheetsExist(secondFiles[0].id!, 'Family');
          return secondFiles[0].id!;
        }
      }

      if (type === 'Family' && !familyName) return null;

      const sheetsConfig = type === 'Personal' ? [
        { properties: { title: 'Personal_Expenses' } },
        { properties: { title: 'Settings' } },
        { properties: { title: 'Goals' } },
      ] : [
        { properties: { title: 'Family_Expenses' } },
        { properties: { title: 'Family_Members' } },
        { properties: { title: 'Monthly_Expenses' } },
        { properties: { title: 'Invitations' } },
      ];

      const spreadsheet = await this.sheets.spreadsheets.create({
        auth: this.auth,
        requestBody: {
          properties: { title: targetName },
          sheets: sheetsConfig,
        },
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId || null;
      if (spreadsheetId) await this.initializeSheets(spreadsheetId, type);
      return spreadsheetId;
  }

  private async ensureSheetsExist(spreadsheetId: string, type: 'Personal' | 'Family') {
    const spreadsheet = await this.sheets.spreadsheets.get({ 
      auth: this.auth,
      spreadsheetId 
    });
    const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
    
    const requiredSheets = type === 'Personal' 
      ? ['Personal_Expenses', 'Settings', 'Goals', 'Calculator_History']
      : ['Family_Expenses', 'Family_Members', 'Monthly_Expenses', 'Invitations', 'Calculator_History', 'Loans', 'Loan_Expenses', 'Loan_Repayments'];

    const missingSheets = requiredSheets.filter(s => !existingSheets.includes(s));

    if (missingSheets.length > 0) {
      const requests = missingSheets.map(title => ({
        addSheet: { properties: { title } }
      }));

      await this.sheets.spreadsheets.batchUpdate({
        auth: this.auth,
        spreadsheetId,
        requestBody: { requests }
      });

      await this.initializeSheets(spreadsheetId, type, missingSheets);
    }
  }

  private async initializeSheets(spreadsheetId: string, type: 'Personal' | 'Family', specificSheets?: string[]) {
    const headers: Record<string, string[][]> = {
      'Personal_Expenses': [['Date', 'Amount', 'Category', 'Note', 'isPaid', 'Type']],
      'Settings': [['Categories'], ['Food'], ['Housing'], ['Transport'], ['Leisure'], ['Health'], ['Shopping'], ['Investment']],
      'Goals': [['Title', 'Target Amount', 'Current Amount', 'Status', 'User Email']],
      'Family_Expenses': [['Date', 'Amount', 'Category', 'Note', 'Added By', 'Family Code']],
      'Family_Members': [['Family Code', 'User Email', 'Role', 'Joined Date', 'Nickname', 'Monthly Income']],
      'Monthly_Expenses': [['Title', 'Amount', 'Due Day', 'Status', 'Family Code', 'Admin Email', 'Last Paid Date', 'Last Paid By', 'Linked Loan']],
      'Invitations': [['Token', 'Email', 'Family Code', 'Spreadsheet ID', 'Status', 'Expiry Date']],
      'Calculator_History': [['Date', 'User', 'Expression', 'Result']],
      'Loans': [['Loan Name', 'Principal Amount', 'Monthly EMI', 'Assigned To', 'Family Code', 'Admin Email', 'Status']],
      'Loan_Expenses': [['Date', 'Amount', 'Category', 'Note', 'Loan Name', 'Added By', 'Family Code']],
      'Loan_Repayments': [['Date', 'Amount', 'Loan Name', 'Paid By', 'Family Code']],
    };

    const sheetsToInit = specificSheets || (type === 'Personal' 
      ? ['Personal_Expenses', 'Settings', 'Goals', 'Calculator_History']
      : ['Family_Expenses', 'Family_Members', 'Monthly_Expenses', 'Invitations', 'Calculator_History', 'Loans', 'Loan_Expenses', 'Loan_Repayments']);

    for (const title of sheetsToInit) {
      if (headers[title]) {
        await this.sheets.spreadsheets.values.update({
          auth: this.auth,
          spreadsheetId,
          range: `${title}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: headers[title] },
        });
      }
    }
  }

  public async getSheetData(spreadsheetId: string, range: string) {
    try {
      const response = await this.sheets.spreadsheets.values.get({ 
        auth: this.auth,
        spreadsheetId, 
        range 
      });
      return response.data.values || [];
    } catch (error) {
      console.error(`Error fetching sheet data for ${spreadsheetId}:`, error);
      return [];
    }
  }

  public async appendRow(spreadsheetId: string, range: string, values: unknown[]) {
    await this.sheets.spreadsheets.values.append({
      auth: this.auth,
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
  }

  public async updateRow(spreadsheetId: string, range: string, values: unknown[]) {
    await this.sheets.spreadsheets.values.update({
      auth: this.auth,
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
  }

  public async updateSheetData(spreadsheetId: string, range: string, values: unknown[][]) {
    await this.sheets.spreadsheets.values.update({
      auth: this.auth,
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  }

  public async shareSheet(spreadsheetId: string, email: string) {
    try {
      await this.drive.permissions.create({
        auth: this.auth,
        fileId: spreadsheetId,
        requestBody: {
          type: 'user',
          role: 'writer',
          emailAddress: email,
        },
      });
      return true;
    } catch (error) {
      console.error('Error sharing sheet:', error);
      return false;
    }
  }

  public async clearRange(spreadsheetId: string, range: string) {
    await this.sheets.spreadsheets.values.clear({
      auth: this.auth,
      spreadsheetId,
      range,
    });
  }
}
