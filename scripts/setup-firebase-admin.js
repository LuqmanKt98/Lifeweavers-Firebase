// scripts/setup-firebase-admin.js
const fs = require('fs');
const path = require('path');

/**
 * Setup Firebase Admin SDK with service account
 * This script helps configure the service account key for Firebase Admin
 */

const SERVICE_ACCOUNT_PATH = 'c:\\Users\\luqma\\Downloads\\lifeweavers-aa9f2-firebase-adminsdk-fbsvc-b0134269bf.json';
const ENV_FILE_PATH = path.join(__dirname, '..', '.env.local');

async function setupFirebaseAdmin() {
  try {
    console.log('🔧 Setting up Firebase Admin SDK...');
    
    // Check if service account file exists
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      console.error('❌ Service account file not found at:', SERVICE_ACCOUNT_PATH);
      console.log('📝 Please ensure the file exists and update the path in this script');
      return;
    }
    
    // Read service account file
    const serviceAccountContent = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountContent);
    
    console.log('✅ Service account file loaded successfully');
    console.log('📋 Project ID:', serviceAccount.project_id);
    console.log('📋 Client Email:', serviceAccount.client_email);
    
    // Read current .env.local file
    let envContent = '';
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    }
    
    // Remove existing FIREBASE_SERVICE_ACCOUNT_KEY if present
    envContent = envContent.replace(/FIREBASE_SERVICE_ACCOUNT_KEY=.*\n?/g, '');
    
    // Add the service account key as a single line
    const serviceAccountLine = `FIREBASE_SERVICE_ACCOUNT_KEY='${JSON.stringify(serviceAccount)}'\n`;
    envContent += serviceAccountLine;
    
    // Write updated .env.local file
    fs.writeFileSync(ENV_FILE_PATH, envContent);
    
    console.log('✅ Service account key added to .env.local');
    console.log('🚀 Firebase Admin SDK is now configured!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Firebase Admin SDK is now ready for use');
    console.log('3. Google Auth can be configured directly in Firebase Console');
    
  } catch (error) {
    console.error('❌ Error setting up Firebase Admin:', error);
    console.log('');
    console.log('Manual setup:');
    console.log('1. Copy the contents of your service account JSON file');
    console.log('2. Add this line to .env.local:');
    console.log('   FIREBASE_SERVICE_ACCOUNT_KEY=\'{"type":"service_account",...}\'');
    console.log('3. Restart your development server');
  }
}

// Run the setup
setupFirebaseAdmin();
