// src/lib/firebase/admin.ts
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try to initialize with service account from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccount) {
      // Parse the service account JSON from environment variable
      const serviceAccountKey = JSON.parse(serviceAccount);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
        projectId: 'lifeweavers-aa9f2'
      });
      
      console.log('✅ Firebase Admin initialized with service account from environment');
    } else {
      // Fallback to application default credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'lifeweavers-aa9f2'
      });
      
      console.log('✅ Firebase Admin initialized with application default credentials');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    
    // Try minimal initialization for development
    try {
      admin.initializeApp({
        projectId: 'lifeweavers-aa9f2'
      });
      console.log('⚠️ Firebase Admin initialized with minimal config (development mode)');
    } catch (fallbackError) {
      console.error('❌ Firebase Admin fallback initialization failed:', fallbackError);
    }
  }
}

export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();
export default admin;
