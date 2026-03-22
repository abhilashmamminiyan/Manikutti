import { google, sheets_v4, drive_v3 } from 'googleapis';
import { ManikuttiSession } from './types';

export const SHEET_NAME = 'Manikutti_v1';

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private drive: drive_v3.Drive;

  constructor(session: ManikuttiSession) {
    if (!session?.accessToken) {
      throw new Error('Google access token not found in session.');
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.drive = google.drive({ version: 'v3', auth });
  }

  public async findOrCreateSheet(): Promise<string | null> {
    try {
      const response = await this.drive.files.list({
        q: `mimeType='application/vnd.google-apps.spreadsheet' and name='${SHEET_NAME}' and trashed=false`,
        fields: 'files(id, name)',
      });

      let spreadsheetId: string | null = null;

      if (response.data.files && response.data.files.length > 0) {
        spreadsheetId = response.data.files[0].id || null;
      } else {
        const spreadsheet = await this.sheets.spreadsheets.create({
          requestBody: {
            properties: { title: SHEET_NAME },
            sheets: [
              { properties: { title: 'Personal_Expenses', gridProperties: { columnCount: 10, rowCount: 1000 } } },
              { properties: { title: 'Family_Expenses', gridProperties: { columnCount: 10, rowCount: 1000 } } },
              { properties: { title: 'Settings', gridProperties: { columnCount: 5, rowCount: 100 } } },
              { properties: { title: 'Family_Members', gridProperties: { columnCount: 5, rowCount: 100 } } },
              { properties: { title: 'EMI_Bills', gridProperties: { columnCount: 5, rowCount: 100 } } },
              { properties: { title: 'Goals', gridProperties: { columnCount: 5, rowCount: 100 } } },
            ],
          },
        });
        spreadsheetId = spreadsheet.data.spreadsheetId || null;
        if (spreadsheetId) await this.initializeSheets(spreadsheetId);
      }
      return spreadsheetId;
    } catch (error) {
      return null;
    }
  }

  private async initializeSheets(spreadsheetId: string) {
    const headers = {
      'Personal_Expenses': [['Date', 'Amount', 'Category', 'Note', 'Status', 'Type']],
      'Family_Expenses': [['Date', 'Amount', 'Category', 'Note', 'Status', 'Paid By', 'Family Code']],
      'Settings': [['Categories'], ['Food'], ['Housing'], ['Transport'], ['Leisure'], ['Health'], ['Shopping'], ['Investment']],
      'Family_Members': [['Family Code', 'User Email', 'Role', 'Joined Date']],
      'EMI_Bills': [['Title', 'Amount', 'Due Date', 'Status', 'Family Code', 'Admin Email']],
      'Goals': [['Title', 'Target Amount', 'Current Amount', 'Status', 'User Email']]
    };

    for (const [sheetName, values] of Object.entries(headers)) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
    }
  }

  public async getSheetData(spreadsheetId: string, range: string) {
    const response = await this.sheets.spreadsheets.values.get({ spreadsheetId, range });
    return response.data.values || [];
  }

  public async appendRow(spreadsheetId: string, range: string, values: any[]) {
    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
  }

  public async updateRow(spreadsheetId: string, range: string, values: any[]) {
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
  }
}
