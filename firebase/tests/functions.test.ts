import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { deleteApp as deleteAdminApp, initializeApp as initAdmin, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminDb, Timestamp } from 'firebase-admin/firestore';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithCustomToken, signOut, type Auth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { DEFAULT_PLANS as SHARED_PLANS, DEFAULT_PRICING as SHARED_PRICING, DEFAULT_SERVICES as SHARED_SERVICES, ROLES as SHARED_ROLES } from '@onlineland/shared';
import { DEFAULT_PLANS as FN_PLANS, DEFAULT_PRICING as FN_PRICING, DEFAULT_SERVICES as FN_SERVICES } from '../functions/src/plans';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { newLead, PROJECT_ID, storedListing } from './helpers';

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

/** A stored listing with admin-SDK timestamps (for writing through firebase-admin). */
const adminListing = (ownerId: string, overrides: Record<string, unknown> = {}) =>
  storedListing(ownerId, { createdAt: Timestamp.now(), updatedAt: Timestamp.now(), ...overrides });

describe('roles are defined once', () => {
  it('functions ROLES matches @onlineland/shared ROLES', () => {
    const src = readFileSync(fileURLToPath(new URL('../functions/src/common.ts', import.meta.url)), 'utf8');
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
    const notes = await adminDb().collection('notifications').where('propertyId', '==', id).get();
    expect(notes.size).toBe(1);
    expect(notes.docs[0]!.data()).toMatchObject({ userId: 'owner1', type: 'property.approved', code: data.code });
  });
  it('codes increase for each new approval', async () => {
    const id = `prop-b-${run}`;
    await adminDb().doc(`properties/${id}`).set(storedListing('owner-b', { createdAt: Timestamp.now(), updatedAt: Timestamp.now() }));
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

describe('revenue (D7)', () => {
  const DAY = 86_400_000;
  const call = (name: string, data: unknown) => httpsCallable(functions, name)(data);
  async function payment(id: string, data: Record<string, unknown>) {
    await adminDb().doc(`paymentRequests/${id}`).set({
      planId: null, propertyId: null, utr: '412345678901', status: 'pending', rejectReason: null,
      reviewedBy: null, reviewedAt: null, createdAt: Timestamp.now(), ...data,
    });
  }
  const notesFor = async (userId: string, type: string) =>
    (await adminDb().collection('notifications').where('userId', '==', userId).where('type', '==', type).get()).size;

  it('plan defaults are the same in functions and @onlineland/shared', () => {
    expect(FN_PLANS).toEqual(SHARED_PLANS);
    expect(FN_PRICING).toEqual(SHARED_PRICING);
  });

  it('approving a Basic payment activates the plan for 30 days and makes the user a dealer', async () => {
    const uid = `dealer-${run}`;
    await createAccount(uid, '+919000000101');
    await adminDb().doc(`users/${uid}`).update({ name: 'Ravi Properties' });
    await payment(`pay-basic-${run}`, { userId: uid, kind: 'plan', planId: 'basic', amountInr: 499 });
    await signInAs(`admin-${run}`);
    const res = (await call('reviewPayment', { paymentId: `pay-basic-${run}`, decision: 'approve' })).data as { status: string; validUntil: number };
    expect(res.status).toBe('approved');
    expect(res.validUntil).toBeGreaterThan(Date.now() + 29 * DAY);
    const dealer = (await adminDb().doc(`dealers/${uid}`).get()).data()!;
    expect(dealer).toMatchObject({ name: 'Ravi Properties', phone: '9000000101', planId: 'basic', ownContact: true, dealerPage: false, verified: false });
    expect((await adminAuth().getUser(uid)).customClaims?.role).toBe('dealer');
    expect((await adminDb().doc(`paymentRequests/pay-basic-${run}`).get()).data()!.status).toBe('approved');
    const subs = await adminDb().collection('subscriptions').where('dealerId', '==', uid).get();
    expect(subs.size).toBe(1);
    expect(await notesFor(uid, 'payment.approved')).toBe(1);
    // the same payment cannot be approved twice
    expect(await callError('reviewPayment', { paymentId: `pay-basic-${run}`, decision: 'approve' })).toBe('functions/failed-precondition');
  });

  it('early renewal of the same plan adds 30 days to what is left', async () => {
    const uid = `dealer-${run}`;
    const before = (await adminDb().doc(`dealers/${uid}`).get()).data()!.validUntil.toMillis();
    await payment(`pay-renew-${run}`, { userId: uid, kind: 'plan', planId: 'basic', amountInr: 499 });
    await signInAs(`admin-${run}`);
    await call('reviewPayment', { paymentId: `pay-renew-${run}`, decision: 'approve' });
    const after = (await adminDb().doc(`dealers/${uid}`).get()).data()!.validUntil.toMillis();
    expect(after - before).toBe(30 * DAY);
  });

  it('refuses an amount below the price; rejection stores the reason', async () => {
    const uid = `dealer-${run}`;
    await payment(`pay-low-${run}`, { userId: uid, kind: 'plan', planId: 'pro', amountInr: 499 });
    await signInAs(`admin-${run}`);
    expect(await callError('reviewPayment', { paymentId: `pay-low-${run}`, decision: 'approve' })).toBe('functions/failed-precondition');
    expect(await callError('reviewPayment', { paymentId: `pay-low-${run}`, decision: 'reject' })).toBe('functions/invalid-argument');
    await call('reviewPayment', { paymentId: `pay-low-${run}`, decision: 'reject', reason: 'UTR not found in bank statement' });
    const p = (await adminDb().doc(`paymentRequests/pay-low-${run}`).get()).data()!;
    expect(p).toMatchObject({ status: 'rejected', rejectReason: 'UTR not found in bank statement' });
    expect(await notesFor(uid, 'payment.rejected')).toBe(1);
  });

  it('only admins review payments', async () => {
    await signInAs(`dealer-${run}`);
    expect(await callError('reviewPayment', { paymentId: `pay-low-${run}`, decision: 'approve' })).toBe('functions/permission-denied');
  });

  it('featured payment puts a listing on top for 7 days; listing payment keeps it live 90 days', async () => {
    const uid = `owner-pay-${run}`;
    await adminDb().doc(`properties/feat-${run}`).set(adminListing(uid, { status: 'approved', code: 'OL-9001' }));
    await adminDb().doc(`properties/paid-${run}`).set(adminListing(uid));
    await payment(`pay-feat-${run}`, { userId: uid, kind: 'featured', propertyId: `feat-${run}`, amountInr: 199 });
    await payment(`pay-list-${run}`, { userId: uid, kind: 'listing', propertyId: `paid-${run}`, amountInr: 199 });
    await signInAs(`admin-${run}`);
    await call('reviewPayment', { paymentId: `pay-feat-${run}`, decision: 'approve' });
    await call('reviewPayment', { paymentId: `pay-list-${run}`, decision: 'approve' });
    const feat = (await adminDb().doc(`properties/feat-${run}`).get()).data()!;
    expect(feat.isFeatured).toBe(true);
    expect(Math.round((feat.featuredUntil.toMillis() - Date.now()) / DAY)).toBe(7);
    const paid = (await adminDb().doc(`properties/paid-${run}`).get()).data()!;
    expect(Math.round((paid.listingPaidUntil.toMillis() - Date.now()) / DAY)).toBe(90);
  });

  it('owner: 1 free listing; the 2nd needs payment; a paid one is approved', async () => {
    const uid = `owner-limit-${run}`;
    for (const n of [1, 2]) {
      await adminDb().doc(`properties/lim${n}-${run}`).set(adminListing(uid));
    }
    await signInAs(`admin-${run}`);
    await call('reviewProperty', { propertyId: `lim1-${run}`, decision: 'approve' });
    expect(await callError('reviewProperty', { propertyId: `lim2-${run}`, decision: 'approve' })).toBe('functions/failed-precondition');
    await adminDb().doc(`properties/lim2-${run}`).update({ listingPaidUntil: Timestamp.fromMillis(Date.now() + 90 * DAY) });
    await call('reviewProperty', { propertyId: `lim2-${run}`, decision: 'approve' });
    expect((await adminDb().doc(`properties/lim2-${run}`).get()).data()!.status).toBe('approved');
  });

  it('dealer without a plan: 2 listings; OnlineLand listings have no limit', async () => {
    const uid = `free-dealer-${run}`;
    for (const n of [1, 2, 3]) {
      await adminDb().doc(`properties/fd${n}-${run}`).set(adminListing(uid, { source: 'dealer' }));
    }
    await signInAs(`admin-${run}`);
    await call('reviewProperty', { propertyId: `fd1-${run}`, decision: 'approve' });
    await call('reviewProperty', { propertyId: `fd2-${run}`, decision: 'approve' });
    expect(await callError('reviewProperty', { propertyId: `fd3-${run}`, decision: 'approve' })).toBe('functions/failed-precondition');
    for (const n of [1, 2, 3]) {
      await adminDb().doc(`properties/ol${n}-${run}`).set(adminListing('admin-own', { source: 'onlineland' }));
      await call('reviewProperty', { propertyId: `ol${n}-${run}`, decision: 'approve' });
    }
  });

  it('admin gives the ✓ Verified badge', async () => {
    const uid = `dealer-${run}`;
    await signInAs(`dealer-${run}`);
    expect(await callError('setVerified', { uid, verified: true })).toBe('functions/permission-denied');
    await signInAs(`admin-${run}`);
    await call('setVerified', { uid, verified: true });
    const d = (await adminDb().doc(`dealers/${uid}`).get()).data()!;
    expect(d.verified).toBe(true);
    expect(d.planId).toBe('basic'); // plan untouched
    expect(d.phone).toBe('9000000101');
  });

  it('Pro dealer uses featured slots (2 per period)', async () => {
    const uid = `pro-${run}`;
    await createAccount(uid, '+919000000102');
    await payment(`pay-pro-${run}`, { userId: uid, kind: 'plan', planId: 'pro', amountInr: 1499 });
    await signInAs(`admin-${run}`);
    await call('reviewPayment', { paymentId: `pay-pro-${run}`, decision: 'approve' });
    for (const n of [1, 2, 3]) {
      await adminDb().doc(`properties/pro${n}-${run}`).set(adminListing(uid, { source: 'dealer', status: 'approved', code: `OL-80${n}` }));
    }
    await signInAs(uid);
    expect(((await call('useFeaturedSlot', { propertyId: `pro1-${run}` })).data as { slotsLeft: number }).slotsLeft).toBe(1);
    await call('useFeaturedSlot', { propertyId: `pro2-${run}` });
    expect(await callError('useFeaturedSlot', { propertyId: `pro3-${run}` })).toBe('functions/resource-exhausted');
    expect(await callError('useFeaturedSlot', { propertyId: `feat-${run}` })).toBe('functions/permission-denied');
    expect((await adminDb().doc(`properties/pro1-${run}`).get()).data()!.isFeatured).toBe(true);
  });

  it('counts views and shares of live listings only', async () => {
    await signOut(auth);
    await call('trackEvent', { propertyId: `feat-${run}`, type: 'view' });
    await call('trackEvent', { propertyId: `feat-${run}`, type: 'view' });
    await call('trackEvent', { propertyId: `feat-${run}`, type: 'share' });
    expect(((await call('trackEvent', { propertyId: `paid-${run}`, type: 'view' })).data as { ok: boolean }).ok).toBe(false);
    expect(await callError('trackEvent', { propertyId: `feat-${run}`, type: 'like' })).toBe('functions/invalid-argument');
    const stats = (await adminDb().doc(`propertyStats/feat-${run}`).get()).data()!;
    expect(stats).toMatchObject({ views: 2, shares: 1 });
  });

  it('a lead from a dealer link is counted and the dealer is notified', async () => {
    const uid = `dealer-${run}`;
    await adminDb().doc(`properties/dl-${run}`).set(adminListing(uid, { source: 'dealer', status: 'approved', code: 'OL-7001' }));
    await adminDb().collection('leads').add({
      propertyId: `dl-${run}`, channel: 'form', name: 'Suresh', phone: '9876543210', message: null, locale: 'te',
      userId: null, stage: 'new', assignedAgentId: null, notes: null, refId: uid, createdAt: Timestamp.now(),
    });
    await waitFor(async () => (await notesFor(uid, 'lead.new')) === 1 || null);
    await waitFor(async () => (await adminDb().doc(`propertyStats/dl-${run}`).get()).data()?.leads === 1 || null);
  });

  it('daily job: reminds 3 days before, ends featured weeks, expires paid listings', async () => {
    await signInAs(`admin-${run}`);
    // Pretend it is 28 days later: the Basic plan (30 days + 30 renewed) is not due; featured (7 d) is over;
    // pretend 92 days later: the paid listing (90 d) expires.
    const r1 = (await call('runMaintenance', { nowMs: Date.now() + 8 * DAY })).data as { unfeatured: number };
    expect(r1.unfeatured).toBeGreaterThanOrEqual(1);
    expect((await adminDb().doc(`properties/feat-${run}`).get()).data()!.isFeatured).toBe(false);
    const r2 = (await call('runMaintenance', { nowMs: Date.now() + 58 * DAY })).data as { reminded: number };
    expect(r2.reminded).toBeGreaterThanOrEqual(1);
    expect(await notesFor(`dealer-${run}`, 'plan.renew')).toBe(1);
    await call('runMaintenance', { nowMs: Date.now() + 58 * DAY });
    expect(await notesFor(`dealer-${run}`, 'plan.renew')).toBe(1); // only once per period
    await adminDb().doc(`properties/paid-${run}`).update({ status: 'approved' }); // the paid listing went live
    await call('runMaintenance', { nowMs: Date.now() + 92 * DAY });
    expect((await adminDb().doc(`properties/paid-${run}`).get()).data()!.status).toBe('expired');
  });
});

describe('maintenance clears abandoned drafts', () => {
  it('a draft older than a day is deleted; a fresh one stays', async () => {
    const base = { ownerId: `drafter-${run}`, status: 'draft', title: { te: 'x', en: '' } };
    await adminDb().doc(`properties/old-draft-${run}`).set({ ...base, createdAt: Timestamp.fromMillis(Date.now() - 3 * 86_400_000) });
    await adminDb().doc(`properties/old-draft-${run}/media/m1`).set({ storagePath: 'x', order: 0 });
    await adminDb().doc(`properties/new-draft-${run}`).set({ ...base, createdAt: Timestamp.now() });
    await signInAs(`admin-${run}`);
    const res = (await httpsCallable(functions, 'runMaintenance')({ nowMs: Date.now() })).data as { drafts: number };
    expect(res.drafts).toBeGreaterThanOrEqual(1);
    expect((await adminDb().doc(`properties/old-draft-${run}`).get()).exists).toBe(false);
    expect((await adminDb().doc(`properties/old-draft-${run}/media/m1`).get()).exists).toBe(false);
    expect((await adminDb().doc(`properties/new-draft-${run}`).get()).exists).toBe(true);
  });
});

describe('Phase 9: yearly plans, services, launch offer', () => {
  const DAY = 86_400_000;
  const call = (name: string, data: unknown) => httpsCallable(functions, name)(data);
  async function payment(id: string, data: Record<string, unknown>) {
    await adminDb().doc(`paymentRequests/${id}`).set({
      planId: null, propertyId: null, utr: '512345678901', status: 'pending', rejectReason: null,
      reviewedBy: null, reviewedAt: null, createdAt: Timestamp.now(), ...data,
    });
  }
  async function serviceRequest(id: string, data: Record<string, unknown>) {
    await adminDb().doc(`serviceRequests/${id}`).set({
      propertyId: null, name: 'Ravi', phone: '9876543210', note: null, locale: 'te', userId: null,
      status: 'new', quotedInr: null, adminNote: null, createdAt: Timestamp.now(), ...data,
    });
  }
  const notesFor = async (userId: string, type: string) =>
    (await adminDb().collection('notifications').where('userId', '==', userId).where('type', '==', type).get()).size;

  it('service defaults are the same in functions and @onlineland/shared', () => {
    expect(FN_SERVICES).toEqual(SHARED_SERVICES);
  });

  it('a yearly Basic payment gives 365 days; the monthly price is not enough for it', async () => {
    const uid = `yearly-${run}`;
    await createAccount(uid, '+919000000201');
    await payment(`pay-y-low-${run}`, { userId: uid, kind: 'plan', planId: 'basic', billing: 'year', amountInr: 499 });
    await payment(`pay-y-${run}`, { userId: uid, kind: 'plan', planId: 'basic', billing: 'year', amountInr: 4999 });
    await signInAs(`admin-${run}`);
    expect(await callError('reviewPayment', { paymentId: `pay-y-low-${run}`, decision: 'approve' })).toBe('functions/failed-precondition');
    const res = (await call('reviewPayment', { paymentId: `pay-y-${run}`, decision: 'approve' })).data as { validUntil: number };
    expect(Math.round((res.validUntil - Date.now()) / DAY)).toBe(365);
    const subs = await adminDb().collection('subscriptions').where('dealerId', '==', uid).get();
    expect(subs.docs[0]!.data()).toMatchObject({ billing: 'year', amountInr: 4999 });
  });

  it('a fixed-price service is priced at once; paying it marks the request paid', async () => {
    const uid = `svc-${run}`;
    await createAccount(uid, '+919000000202');
    await serviceRequest(`sr-drone-${run}`, { serviceId: 'drone', userId: uid });
    const quoted = await waitFor(async () => {
      const d = (await adminDb().doc(`serviceRequests/sr-drone-${run}`).get()).data();
      return d?.status === 'quoted' ? d : null;
    });
    expect(quoted.quotedInr).toBe(1999);
    // The trigger writes the quote and the notice separately; wait for the notice too.
    expect(await waitFor(async () => (await notesFor(uid, 'service.quoted')) || null)).toBe(1);

    await payment(`pay-svc-low-${run}`, { userId: uid, kind: 'service', serviceRequestId: `sr-drone-${run}`, amountInr: 999 });
    await payment(`pay-svc-${run}`, { userId: uid, kind: 'service', serviceRequestId: `sr-drone-${run}`, amountInr: 1999 });
    await signInAs(`admin-${run}`);
    expect(await callError('reviewPayment', { paymentId: `pay-svc-low-${run}`, decision: 'approve' })).toBe('functions/failed-precondition');
    await call('reviewPayment', { paymentId: `pay-svc-${run}`, decision: 'approve' });
    const sr = (await adminDb().doc(`serviceRequests/sr-drone-${run}`).get()).data()!;
    expect(sr).toMatchObject({ status: 'paid', paymentId: `pay-svc-${run}` });
    expect(await notesFor(uid, 'payment.approved')).toBe(1);
  });

  it('a survey request waits for the admin quote; only admins quote; a paid request cannot be re-quoted', async () => {
    const uid = `svc-${run}`;
    await serviceRequest(`sr-survey-${run}`, { serviceId: 'survey', userId: uid });
    await new Promise((r) => setTimeout(r, 1500));
    expect((await adminDb().doc(`serviceRequests/sr-survey-${run}`).get()).data()!.status).toBe('new');
    await signInAs(uid);
    expect(await callError('quoteService', { requestId: `sr-survey-${run}`, amountInr: 5000 })).toBe('functions/permission-denied');
    await signInAs(`admin-${run}`);
    expect(await callError('quoteService', { requestId: `sr-survey-${run}`, amountInr: 0 })).toBe('functions/invalid-argument');
    await call('quoteService', { requestId: `sr-survey-${run}`, amountInr: 5000, note: '3 ఎకరాలు' });
    expect((await adminDb().doc(`serviceRequests/sr-survey-${run}`).get()).data()).toMatchObject({ status: 'quoted', quotedInr: 5000, adminNote: '3 ఎకరాలు' });
    expect(await callError('quoteService', { requestId: `sr-drone-${run}`, amountInr: 100 })).toBe('functions/failed-precondition');
  });

  it('launch offer: only while on, only in offer districts, only once', async () => {
    const uid = `offer-${run}`;
    await createAccount(uid, '+919000000203');
    await signInAs(uid);
    expect(await callError('claimLaunchOffer', { district: 'narayanpet' })).toBe('functions/failed-precondition'); // off
    await adminDb().doc('settings/pricing').set({ launchOfferActive: true, launchOfferDistricts: ['narayanpet'] }, { merge: true });
    try {
      expect(await callError('claimLaunchOffer', { district: 'hyderabad' })).toBe('functions/failed-precondition');
      const res = (await call('claimLaunchOffer', { district: 'narayanpet' })).data as { planId: string; validUntil: number };
      expect(res.planId).toBe('basic');
      expect(Math.round((res.validUntil - Date.now()) / DAY)).toBe(90);
      expect((await adminDb().doc(`dealers/${uid}`).get()).data()).toMatchObject({ planId: 'basic', ownContact: true });
      expect((await adminAuth().getUser(uid)).customClaims?.role).toBe('dealer');
      expect(await callError('claimLaunchOffer', { district: 'narayanpet' })).toBe('functions/already-exists');
    } finally {
      await adminDb().doc('settings/pricing').set({ launchOfferActive: false }, { merge: true });
    }
  });
});

describe('deleteProperty', () => {
  it('admin deletes a listing with its media, private contact and stats; keeps leads', async () => {
    const id = `del-prop-${run}`;
    await adminDb().doc(`properties/${id}`).set(storedListing('owner-del', { status: 'approved', code: 'OL-9999', createdAt: Timestamp.now(), updatedAt: Timestamp.now() }));
    await adminDb().doc(`properties/${id}/media/m1`).set({ url: 'x' });
    await adminDb().doc(`properties/${id}/private/contact`).set({ phone: '9000000000' });
    await adminDb().doc(`propertyStats/${id}`).set({ views: 3 });
    await adminDb().doc(`leads/del-lead-${run}`).set(newLead({ propertyId: id, createdAt: Timestamp.now() }));
    await signInAs(`admin-${run}`);
    const res = await httpsCallable(functions, 'deleteProperty')({ propertyId: id });
    expect(res.data).toEqual({ propertyId: id, deleted: true });
    expect((await adminDb().doc(`properties/${id}`).get()).exists).toBe(false);
    expect((await adminDb().collection(`properties/${id}/media`).get()).size).toBe(0);
    expect((await adminDb().doc(`properties/${id}/private/contact`).get()).exists).toBe(false);
    expect((await adminDb().doc(`propertyStats/${id}`).get()).exists).toBe(false);
    expect((await adminDb().doc(`leads/del-lead-${run}`).get()).exists).toBe(true);
    const logs = await adminDb().collection('auditLogs').where('target', '==', `properties/${id}`).get();
    expect(logs.docs.map((d) => d.data().action)).toEqual(['property.delete']);
  });
  it('only admins can delete; a missing listing is not-found', async () => {
    const id = `del-prop2-${run}`;
    await adminDb().doc(`properties/${id}`).set(storedListing('owner-del2', { status: 'approved', createdAt: Timestamp.now(), updatedAt: Timestamp.now() }));
    await signInAs('owner-del2');
    expect(await callError('deleteProperty', { propertyId: id })).toBe('functions/permission-denied');
    expect((await adminDb().doc(`properties/${id}`).get()).exists).toBe(true);
    await signInAs(`admin-${run}`);
    expect(await callError('deleteProperty', { propertyId: `nope-${run}` })).toBe('functions/not-found');
  });
});

describe('deleteMyAccount', () => {
  it('deletes profile, favourites, devices, dealer card and login; takes listings down; keeps payments', async () => {
    const uid = `leaver-${run}`;
    await createAccount(uid, '+919000000555');
    await adminDb().doc(`users/${uid}/favorites/x`).set({ savedAt: Timestamp.now() });
    await adminDb().doc(`users/${uid}/devices/tok`).set({ token: 'tok', platform: 'android', updatedAt: Timestamp.now() });
    await adminDb().doc(`dealers/${uid}`).set({ name: 'Leaver', verified: false, planId: 'free' });
    await adminDb().doc(`properties/leave-${run}`).set(adminListing(uid, { status: 'approved', code: 'OL-6001', isFeatured: true }));
    await adminDb().doc(`properties/leave-${run}/private/contact`).set({ ownerName: 'L', ownerPhone: '9000000555' });
    await adminDb().doc(`paymentRequests/leave-pay-${run}`).set({ userId: uid, kind: 'plan', status: 'approved' });

    await signInAs(uid);
    const res = (await httpsCallable(functions, 'deleteMyAccount')({})).data as { listingsTakenDown: number };
    expect(res.listingsTakenDown).toBe(1);
    await expect(adminAuth().getUser(uid)).rejects.toThrow();
    for (const path of [`users/${uid}`, `users/${uid}/favorites/x`, `users/${uid}/devices/tok`, `dealers/${uid}`, `properties/leave-${run}/private/contact`]) {
      expect((await adminDb().doc(path).get()).exists, path).toBe(false);
    }
    expect((await adminDb().doc(`properties/leave-${run}`).get()).data()).toMatchObject({ status: 'expired', isFeatured: false });
    expect((await adminDb().doc(`paymentRequests/leave-pay-${run}`).get()).exists).toBe(true);
  });

  it('admins cannot delete themselves; signed-out callers are refused', async () => {
    await signInAs(`admin-${run}`);
    expect(await callError('deleteMyAccount', {})).toBe('functions/failed-precondition');
    await signOut(auth);
    expect(await callError('deleteMyAccount', {})).toBe('functions/unauthenticated');
  });
});

describe('scripts/set-role.mjs (first-admin setup)', () => {
  it('gives an existing user a role by phone number', async () => {
    const uid = `cli-${run}`;
    await createAccount(uid, '+919000000077');
    const script = fileURLToPath(new URL('../../scripts/set-role.mjs', import.meta.url));
    const out = execFileSync('node', [script, '--project', PROJECT_ID, '--phone', '+919000000077', '--role', 'admin'], {
      env: process.env,
      encoding: 'utf8',
    });
    expect(out).toContain('buyer → admin');
    expect((await adminAuth().getUser(uid)).customClaims?.role).toBe('admin');
    expect((await adminDb().doc(`users/${uid}`).get()).data()?.role).toBe('admin');
  });
  it('refuses to touch any other Firebase project', () => {
    const script = fileURLToPath(new URL('../../scripts/set-role.mjs', import.meta.url));
    for (const project of ['onlineland-28234', 'vahan-3e329', 'ridekart-70332', 'scraplake']) {
      expect(() =>
        execFileSync('node', [script, '--project', project, '--uid', 'x', '--role', 'admin'], { env: process.env, stdio: 'pipe' }),
      ).toThrow(/Refusing to run/);
    }
  });
  it('refuses an unknown role', () => {
    const script = fileURLToPath(new URL('../../scripts/set-role.mjs', import.meta.url));
    expect(() =>
      execFileSync('node', [script, '--project', PROJECT_ID, '--uid', 'x', '--role', 'king'], { env: process.env, stdio: 'pipe' }),
    ).toThrow();
  });
});
