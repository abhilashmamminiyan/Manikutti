import { google, sheets_v4, drive_v3 } from 'googleapis';
import { ManikuttiSession } from './types';
import { parsePrivateKey } from './authHelper';

export const PERSONAL_SHEET_NAME = 'Manikutti_v2_Personal';
export const FAMILY_SHEET_PREFIX = 'Manikutti_v2_Family_';

export class GoogleSheetsService {
  private userEmail?: string;
  private sheets: sheets_v4.Sheets;
  private drive: drive_v3.Drive;
  private auth: any;

  constructor(userEmail?: string) {
    this.userEmail = userEmail;
    
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = parsePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);

    if (!clientEmail || !privateKey) {
      console.error('[GoogleSheetsService] Service Account credentials are not configured in environment variables.');
      throw new Error('Google Service Account credentials missing.');
    }

    this.auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  public async findAllFamilySheets(): Promise<{id: string, name: string}[]> {
    try {
      const adminSheetId = process.env.ADMIN_SPREADSHEET_ID;
      if (!adminSheetId) return [];
      
      const response = await this.drive.files.get({
        auth: this.auth,
        fileId: adminSheetId,
        fields: 'id, name',
      });
      return [{ id: response.data.id!, name: response.data.name! }];
    } catch (error) {
      console.error('[GoogleSheetsService] Error in findAllFamilySheets:', error);
      return [];
    }
  }

  private async checkMembership(spreadsheetId: string, email: string): Promise<boolean> {
    try {
      const rows = await this.getSheetData(spreadsheetId, 'Family_Members!B:B');
      const normalizedEmail = email.trim().toLowerCase();
      const isMember = rows.slice(1).some(r => r[0]?.toString().trim().toLowerCase() === normalizedEmail);
      return isMember;
    } catch (error) {
      console.error(`[GoogleSheetsService] Membership check failed for ${spreadsheetId}:`, error);
      return false;
    }
  }

  public async findOrCreateSheet(type: 'Personal' | 'Family', familyName?: string): Promise<string | null> {
      if (type === 'Family') {
        const familySheetId = process.env.FAMILY_SPREADSHEET_ID;
        if (!familySheetId) {
          console.error('[GoogleSheetsService] FAMILY_SPREADSHEET_ID is missing in environment variables');
          throw new Error('FAMILY_SPREADSHEET_ID not configured.');
        }
        await this.ensureSheetsExist(familySheetId, 'Family');
        return familySheetId;
      }

      // Personal Sheet
      if (!this.userEmail) {
        throw new Error('User email is required for Personal spreadsheet operations.');
      }

      const adminSheetId = process.env.ADMIN_SPREADSHEET_ID;
      if (!adminSheetId) {
        console.error('[GoogleSheetsService] ADMIN_SPREADSHEET_ID is missing in environment variables');
        throw new Error('ADMIN_SPREADSHEET_ID not configured.');
      }

      // Ensure that 'User_Sheets' exists in the Admin Spreadsheet
      await this.ensureSheetsExist(adminSheetId, 'Admin');

      // Look up userEmail in User_Sheets mapping
      const userSheetsRows = await this.getSheetData(adminSheetId, 'User_Sheets!A:B');
      const cleanEmail = this.userEmail.trim().toLowerCase();
      
      const userMappingRow = userSheetsRows.slice(1).find(r => r[0]?.toString().trim().toLowerCase() === cleanEmail);

      if (userMappingRow && userMappingRow[1]) {
        const spreadsheetId = userMappingRow[1].toString();
        await this.ensureSheetsExist(spreadsheetId, 'Personal');
        return spreadsheetId;
      }

      // If not found in the Admin index, create a new Personal spreadsheet
      const targetName = `Manikutti_Personal_${this.userEmail}`;
      console.log(`[GoogleSheetsService] Mapped sheet not found. Creating new Personal sheet type=Personal userEmail=${this.userEmail}`);
      
      // Create new Personal sheet under service account
      const sheetsConfig = [
        { properties: { title: 'Personal_Expenses' } },
        { properties: { title: 'Settings' } },
        { properties: { title: 'Goals' } },
      ];

      const spreadsheet = await this.sheets.spreadsheets.create({
        auth: this.auth,
        requestBody: {
          properties: { title: targetName },
          sheets: sheetsConfig,
        },
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId || null;
      if (spreadsheetId) {
        await this.initializeSheets(spreadsheetId, 'Personal');
        await this.shareSheet(spreadsheetId, this.userEmail);

        // Record the new mapping in the Admin spreadsheet index
        await this.appendRow(adminSheetId, 'User_Sheets', [this.userEmail, spreadsheetId]);
      }
      return spreadsheetId;
  }

  public async ensureSheetsExist(spreadsheetId: string, type: 'Personal' | 'Family' | 'Admin') {
    const spreadsheet = await this.sheets.spreadsheets.get({ 
      auth: this.auth,
      spreadsheetId 
    });
    const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
    
    let requiredSheets: string[] = [];
    if (type === 'Personal') {
      requiredSheets = ['Personal_Expenses', 'Settings', 'Goals', 'Calculator_History'];
    } else if (type === 'Family') {
      requiredSheets = ['Family_Expenses', 'Family_Members', 'Monthly_Expenses', 'Invitations', 'Calculator_History', 'Loans', 'Loan_Expenses', 'Loan_Repayments'];
    } else if (type === 'Admin') {
      requiredSheets = ['User_Sheets'];
    }

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

  private async initializeSheets(spreadsheetId: string, type: 'Personal' | 'Family' | 'Admin', specificSheets?: string[]) {
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
      'User_Sheets': [['Email', 'Spreadsheet ID']],
    };

    let defaultSheets: string[] = [];
    if (type === 'Personal') {
      defaultSheets = ['Personal_Expenses', 'Settings', 'Goals', 'Calculator_History'];
    } else if (type === 'Family') {
      defaultSheets = ['Family_Expenses', 'Family_Members', 'Monthly_Expenses', 'Invitations', 'Calculator_History', 'Loans', 'Loan_Expenses', 'Loan_Repayments'];
    } else if (type === 'Admin') {
      defaultSheets = ['User_Sheets'];
    }

    const sheetsToInit = specificSheets || defaultSheets;

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
