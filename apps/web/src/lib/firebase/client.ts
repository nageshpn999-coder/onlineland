/**
 * Firebase for the browser (website). Uses the public web config from NEXT_PUBLIC_* env vars,
 * or the local emulators when NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true.
 * Security comes from Firestore/Storage rules and App Check, not from hiding this config.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
import { FUNCTIONS_REGION } from '@onlineland/shared';

const USE_EMULATORS = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const DEMO_PROJECT = 'demo-onlineland';

// Each NEXT_PUBLIC_* name is written out in full so Next.js can inline it at build time.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${DEMO_PROJECT}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEMO_PROJECT,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${DEMO_PROJECT}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
}

let client: FirebaseClient | null = null;

export function firebaseClient(): FirebaseClient {
  if (client) return client;
  if (!USE_EMULATORS && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    throw new Error(
      'Firebase web config is missing. Set NEXT_PUBLIC_FIREBASE_* in .env.local, or NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true for local work.',
    );
  }

  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const functions = getFunctions(app, FUNCTIONS_REGION);

  if (USE_EMULATORS) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  }

  client = { app, auth, db, storage, functions };
  return client;
}
