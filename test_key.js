const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const envPath = path.join(__dirname, '.env');

console.log('--- Google Sheets Storage Diagnostics ---');

if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env file does not exist!');
  process.exit(1);
}

// Simple env loader
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  if (line.trim() && !line.trim().startsWith('#')) {
    const parts = line.split('=');
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);
    env[key] = val;
  }
});

const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
let rawKey = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

if (!clientEmail || !rawKey) {
  console.error('ERROR: Missing credentials in .env file!');
  process.exit(1);
}

// Clean private key
let key = rawKey.trim();
if (key.endsWith(',')) {
  key = key.substring(0, key.length - 1).trim();
}
let prevKey = '';
while (key !== prevKey) {
  prevKey = key;
  if (key.startsWith('"') && key.endsWith('"')) key = key.substring(1, key.length - 1).trim();
  if (key.startsWith("'") && key.endsWith("'")) key = key.substring(1, key.length - 1).trim();
}
const privateKey = key.replace(/\\n/g, '\n');

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: [
    'https://www.googleapis.com/auth/drive'
  ]
});

const drive = google.drive({ version: 'v3', auth });

async function runDiagnostics() {
  try {
    // 1. Get Storage Quota Info
    console.log('Fetching Service Account Storage Quota...');
    const about = await drive.about.get({
      fields: 'storageQuota, user'
    });
    console.log('Service Account user:', about.data.user.displayName, `(${about.data.user.emailAddress})`);
    
    const quota = about.data.storageQuota;
    const limit = parseInt(quota.limit) || 0;
    const usage = parseInt(quota.usage) || 0;
    console.log(`Storage Limit: ${(limit / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    console.log(`Storage Usage: ${(usage / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    
    // 2. List Active Files
    console.log('\nListing active files owned by the Service Account...');
    const files = await drive.files.list({
      q: "trashed = false",
      fields: 'files(id, name, size, mimeType)'
    });
    console.log(`Found ${files.data.files.length} active files:`);
    files.data.files.forEach(f => {
      console.log(`- ${f.name} (ID: ${f.id}) - size: ${f.size || 'unknown'}`);
    });
    
    // 3. List Trashed Files
    console.log('\nListing trashed files...');
    const trashedFiles = await drive.files.list({
      q: "trashed = true",
      fields: 'files(id, name, size)'
    });
    console.log(`Found ${trashedFiles.data.files.length} files in trash.`);
    
    if (trashedFiles.data.files.length > 0) {
      console.log('Attempting to empty the trash for the Service Account...');
      await drive.files.emptyTrash();
      console.log('SUCCESS: Trash emptied!');
    }
  } catch (err) {
    console.error('DIAGNOSTICS ERROR:', err.message);
  }
}

runDiagnostics();
