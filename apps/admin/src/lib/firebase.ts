/**
 * Firebase for the admin dashboard (browser only). Same public web config as the website,
 * or the local emulators when NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true.
 * Only onlineland-dev, onlineland-prod and demo-* projects are accepted — never another project.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
import { FUNCTIONS_REGION } from '@onlineland/shared';

export const USE_EMULATORS = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const DEMO_PROJECT = 'demo-onlineland';
const ALLOWED = ['onlineland-dev', 'onlineland-prod'];

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

export function fb(): FirebaseClient {
  if (client) return client;
  const project = config.projectId;
  if (!project.startsWith('demo-') && !ALLOWED.includes(project)) {
    throw new Error(`Refusing to connect to Firebase project "${project}". Only ${ALLOWED.join(', ')} are allowed.`);
  }
  if (!USE_EMULATORS && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    throw new Error('Firebase web config is missing. Set NEXT_PUBLIC_FIREBASE_* or NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true.');
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
    auth.settings.appVerificationDisabledForTesting = true;
  }
  // App Check (reCAPTCHA Enterprise): proves requests come from our site, not a bot. On only when the key is set.
  const recaptcha = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!USE_EMULATORS && recaptcha && typeof window !== 'undefined') {
    initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(recaptcha), isTokenAutoRefreshEnabled: true });
  }

  client = { app, auth, db, storage, functions };
  return client;
}

/** Calls a Cloud Function and returns its data. */
export async function callFn<T = unknown>(name: string, data: unknown): Promise<T> {
  const res = await httpsCallable(fb().functions, name)(data);
  return res.data as T;
}

/** Public URL of a Storage object (photos). */
export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const bucket = config.storageBucket;
  const host = USE_EMULATORS ? 'http://127.0.0.1:9199' : 'https://firebasestorage.googleapis.com';
  return `${host}/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
}

/** Readable message from a Firebase error. */
export function errorText(e: unknown): string {
  const err = e as { message?: string; code?: string };
  const msg = err.message ?? String(e);
  return msg.replace(/^Firebase: /, '').replace(/\s*\(.*\)\.?$/, '');
}
