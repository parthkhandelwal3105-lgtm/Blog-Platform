// ==========================================
// Firebase Admin SDK & Firestore Configuration
// ==========================================

const admin = require('firebase-admin');
require('dotenv').config();

/**
 * ----------------------------------------------------
 * Why Firebase Admin SDK?
 * ----------------------------------------------------
 * The Firebase Admin SDK gives our Node.js server secure,
 * privileged access to Firebase services (like Cloud Firestore).
 * Unlike frontend Firebase SDKs, this runs exclusively on the
 * server and must NEVER be exposed to the browser.
 */

// Retrieve credentials from environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Check if credentials are placeholders or empty
const isPlaceholder =
  !projectId ||
  !clientEmail ||
  !privateKey ||
  projectId === 'your-firebase-project-id' ||
  privateKey.includes('your_private_key_here');

// Clean and format private key if present
if (privateKey && !isPlaceholder) {
  // If the key has quotes around it, strip them
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  // Replace literal '\n' string escapes with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');
}

// Track whether Firebase initialized successfully
let db = null;
let isConfigured = false;

if (isPlaceholder) {
  console.warn('\n⚠️  [Firebase Warning]: Firebase credentials are not yet configured in your .env file!');
  console.warn('   To connect to Cloud Firestore, replace the placeholders in .env with your');
  console.warn('   Firebase Service Account private key values (see README.md for step-by-step instructions).\n');
} else {
  try {
    // Initialize the Firebase Admin App only once
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey,
        }),
      });
    }

    // Connect to Cloud Firestore
    db = admin.firestore();
    isConfigured = true;
    console.log(`[Firebase] Successfully connected to Firestore project: ${projectId}`);
  } catch (error) {
    console.error('❌ [Firebase Error]: Failed to initialize Firebase Admin SDK:');
    console.error(`   Message: ${error.message}`);
    console.error('   Hint: Make sure FIREBASE_PRIVATE_KEY preserves the "\\n" characters.\n');
  }
}

// Export the Firestore database instance and helper utilities
module.exports = {
  admin,
  db,
  isConfigured,
  // Helper to get server timestamp
  serverTimestamp: () => admin.firestore.FieldValue.serverTimestamp(),
};
