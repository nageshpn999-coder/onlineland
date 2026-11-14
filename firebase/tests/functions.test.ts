import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { deleteApp as deleteAdminApp, initializeApp as initAdmin, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminDb, Timestamp } from 'firebase-admin/firestore';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithCustomToken, signOut, type Auth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { ROLES as SHARED_ROLES } from '@onlineland/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PROJECT_ID, storedListing } from './helpers';

// emulators:exec sets FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST for this process.
let admin: App;
let client: FirebaseApp;
let auth: Auth;
let functions: Functions;

beforeAll(() => {
  admin = initAdmin({ projectId: PROJECT_ID }, 'functions-test-admin');
  client = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-key', authDomain: `${PROJECT_ID}.firebaseapp.com` }, 'functions-test-client');
  auth = getAuth(client);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  functions = getFunctions(client, 'asia-south1');
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
});

afterAll(async () => {
  await signOut(auth).catch(() => undefined);
  await deleteApp(client);
  await deleteAdminApp(admin);
});

const adminAuth = () => getAdminAuth(admin);
const adminDb = () => getAdminDb(admin);

async function waitFor<T>(fn: () => Promise<T | undefined | null>, ms = 15_000): Promise<T> {
  const until = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > until) throw new Error('Timed out waiting for condition');
    await new Promise((r) => setTimeout(r, 250));
  }
}

/** Creates an account (fires onUserCreated) and waits until its profile exists. */
async function createAccount(uid: string, phone: string) {
  await adminAuth().createUser({ uid, phoneNumber: phone });
  return waitFor(async () => {
    const snap = await adminDb().doc(`users/${uid}`).get();
    return snap.exists ? snap.data() : null;
  });
}

async function signInAs(uid: string) {
  await signOut(auth).catch(() => undefined);
  const token = await adminAuth().createCustomToken(uid);
  const cred = await signInWithCustomToken(auth, token);
  return cred.user;
}

async function callError(name: string, data: unknown): Promise<string> {
  try {
    await httpsCallable(functions, name)(data);
    return 'no-error';
  } catch (e) {
    return (e as { code?: string }).code ?? 'unknown';
  }
}

const run = Date.now().toString(36);

describe('roles are defined once', () => {
  it('functions ROLES matches @onlineland/shared ROLES', () => {
    const src = readFileSync(fileURLToPath(new URL('../functions/src/index.ts', import.meta.url)), 'utf8');
    const match = src.match(/export const ROLES = \[([^\]]+)\]/);
    const fnRoles = match![1]!.split(',').map((s) => s.trim().replace(/'/g, ''));
    expect(fnRoles).toEqual([...SHARED_ROLES]);
  });
});

describe('onUserCreated', () => {
  it('creates a buyer profile and role claim for a new phone user', async () => {
    const profile = await createAccount(`buyer-${run}`, '+919000000001');
    expect(profile.role).toBe('buyer');
    expect(profile.phone).toBe('+919000000001');
    expect(profile.language).toBe('te');
    const user = await adminAuth().getUser(`buyer-${run}`);
    expect(user.customClaims?.role).toBe('buyer');
  });
});

describe('becomeOwner', () => {
  it('turns a buyer into an owner', async () => {
    const uid = `seller-${run}`;
    await createAccount(uid, '+919000000002');
    const user = await signInAs(uid);
    const res = await httpsCallable(functions, 'becomeOwner')({});
    expect(res.data).toEqual({ role: 'owner' });
    const token = await user.getIdTokenResult(true);
    expect(token.claims.role).toBe('owner');
    expect((await adminDb().doc(`users/${uid}`).get()).data()?.role).toBe('owner');
  });
  it('requires sign-in', async () => {
    await signOut(auth);
    expect(await callError('becomeOwner', {})).toBe('functions/unauthenticated');
  });
});

describe('setUserRole', () => {
  it('non-admin is refused', async () => {
    await signInAs(`seller-${run}`);
    expect(await callError('setUserRole', { uid: `buyer-${run}`, role: 'admin' })).toBe('functions/permission-denied');
  });
  it('admin makes a buyer a dealer', async () => {
    const adminUid = `admin-${run}`;
    await createAccount(adminUid, '+919000000009');
    await adminAuth().setCustomUserClaims(adminUid, { role: 'admin' });
    await signInAs(adminUid);
    const res = await httpsCallable(functions, 'setUserRole')({ uid: `buyer-${run}`, role: 'dealer' });
    expect(res.data).toEqual({ uid: `buyer-${run}`, role: 'dealer' });
    expect((await adminAuth().getUser(`buyer-${run}`)).customClaims?.role).toBe('dealer');
    const logs = await adminDb().collection('auditLogs').where('action', '==', 'user.setRole').where('target', '==', `users/buyer-${run}`).get();
    expect(logs.size).toBe(1);
  });
  it('rejects unknown roles and self-demotion', async () => {
    await signInAs(`admin-${run}`);
    expect(await callError('setUserRole', { uid: `buyer-${run}`, role: 'king' })).toBe('functions/invalid-argument');
    expect(await callError('setUserRole', { uid: `admin-${run}`, role: 'buyer' })).toBe('functions/failed-precondition');
  });
});

describe('reviewProperty', () => {
  it('admin approves a pending listing and it gets a code', async () => {
    const id = `prop-a-${run}`;
    await adminDb().doc(`properties/${id}`).set(storedListing('owner1', { createdAt: Timestamp.now(), updatedAt: Timestamp.now() }));
    await signInAs(`admin-${run}`);
    const res = await httpsCallable(functions, 'reviewProperty')({ propertyId: id, decision: 'approve' });
    const data = res.data as { status: string; code: string };
    expect(data.status).toBe('approved');
    expect(data.code).toMatch(/^OL-\d{4,}$/);
    const saved = (await adminDb().doc(`properties/${id}`).get()).data()!;
    expect(saved.status).toBe('approved');
    expect(saved.code).toBe(data.code);
    expect(saved.reviewedBy).toBe(`admin-${run}`);
    const logs = await adminDb().collection('auditLogs').where('target', '==', `properties/${id}`).get();
    expect(logs.docs.map((d) => d.data().action)).toEqual(['property.approve']);
  });
  it('codes increase for each new approval', async () => {
    const id = `prop-b-${run}`;
    await adminDb().doc(`properties/${id}`).set(storedListing('owner1', { createdAt: Timestamp.now(), updatedAt: Timestamp.now() }));
    await signInAs(`admin-${run}`);
    const first = (await adminDb().doc(`properties/prop-a-${run}`).get()).data()!.code as string;
    const res = await httpsCallable(functions, 'reviewProperty')({ propertyId: id, decision: 'approve' });
    expect(Number((res.data as { code: string }).code.slice(3))).toBe(Number(first.slice(3)) + 1);
  });
  it('rejection needs a reason and stores it', async () => {
    const id = `prop-c-${run}`;
    await adminDb().doc(`properties/${id}`).set(storedListing('owner1', { createdAt: Timestamp.now(), updatedAt: Timestamp.now() }));
    await signInAs(`admin-${run}`);
    expect(await callError('reviewProperty', { propertyId: id, decision: 'reject' })).toBe('functions/invalid-argument');
    await httpsCallable(functions, 'reviewProperty')({ propertyId: id, decision: 'reject', reason: 'Documents unclear' });
    const saved = (await adminDb().doc(`properties/${id}`).get()).data()!;
    expect(saved.status).toBe('rejected');
    expect(saved.rejectReason).toBe('Documents unclear');
  });
  it('only pending listings can be reviewed; only admins may review', async () => {
    await signInAs(`admin-${run}`);
    expect(await callError('reviewProperty', { propertyId: `prop-a-${run}`, decision: 'approve' })).toBe('functions/failed-precondition');
    expect(await callError('reviewProperty', { propertyId: 'does-not-exist', decision: 'approve' })).toBe('functions/not-found');
    await signInAs(`seller-${run}`);
    expect(await callError('reviewProperty', { propertyId: `prop-c-${run}`, decision: 'approve' })).toBe('functions/permission-denied');
  });
});
