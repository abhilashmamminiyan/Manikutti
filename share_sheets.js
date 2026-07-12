const { google } = require('googleapis');
require('dotenv').config();

async function shareFile(driveService, fileId, emailAddress) {
  try {
    await driveService.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: emailAddress,
      },
      fields: 'id',
    });
    console.log(`Successfully shared file ${fileId} with ${emailAddress}`);
  } catch (error) {
    console.error(`Error sharing file ${fileId}:`, error.message);
  }
}

async function main() {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  const adminEmail = 'dev.abhilashm@gmail.com';

  const filesToShare = [
    process.env.ADMIN_SPREADSHEET_ID,
    process.env.FAMILY_SPREADSHEET_ID,
    process.env.DRIVE_FOLDER_ID
  ];

  for (const fileId of filesToShare) {
    if (fileId) {
      await shareFile(drive, fileId, adminEmail);
    }
  }
}

main().catch(console.error);
