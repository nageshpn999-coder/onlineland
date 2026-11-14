/**
 * Firebase Admin for server code only (server components, route handlers, server actions).
 * Credentials come from server-only env vars set in Vercel; never prefix them with NEXT_PUBLIC_.
 * Importing this file from a client component fails the build (server-only).
 */
import 'server-only';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const APP_NAME = 'onlineland-admin';

function init(): App {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
    return initializeApp({ projectId: projectId || 'demo-onlineland' }, APP_NAME);
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Vercel stores the key on one line; restore its line breaks.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials are missing. Set FIREBASE_ADMIN_PROJECT_ID, _CLIENT_EMAIL and _PRIVATE_KEY (server only).');
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId }, APP_NAME);
}

export function firebaseAdmin(): { db: Firestore; auth: Auth } {
  const app = getApps().find((a) => a.name === APP_NAME) ?? init();
  return { db: getFirestore(app), auth: getAuth(app) };
}
