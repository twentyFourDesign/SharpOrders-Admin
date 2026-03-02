import {initializeApp, getApps} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {getStorage} from 'firebase/storage';
import {getDatabase} from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (
  process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL &&
  process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL.startsWith('http')
) {
  firebaseConfig.databaseURL = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
}

console.log('[Firebase Web] Initializing with Config:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  hasDatabaseUrl: !!firebaseConfig.databaseURL,
});

// Explicit singleton initialization
let app;
const existingApps = getApps();
if (existingApps.length > 0) {
  app = existingApps[0];
} else {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase Web] initializeApp called successfully');
  } else {
    console.error(
      '[Firebase Web] Cannot initialize: API Key is missing. Check .env and restart bundler.',
    );
  }
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const realDB = app ? getDatabase(app) : null;

export {app};
export default app;
