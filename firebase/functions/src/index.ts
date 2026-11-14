/**
 * OnlineLand Cloud Functions — Phase 4.
 *
 * Every privileged action runs here, never in a browser or app:
 *  - onUserCreated   new sign-in → users/{uid} profile + "buyer" role
 *  - becomeOwner     a buyer who wants to post a property becomes an "owner"
 *  - setUserRole     admin assigns any role (dealer, agent, admin…)
 *  - reviewProperty  admin approves or rejects a pending listing (+ audit log, property code)
 *
 * This package is deployed on its own, so it does not import @onlineland/shared;
 * tests check that ROLES below matches the shared list.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, type Transaction } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import * as functionsV1 from 'firebase-functions/v1';
import { logger } from 'firebase-functions';

export const REGION = 'asia-south1';
export const ROLES = ['buyer', 'owner', 'dealer', 'agent', 'admin'] as const;
type Role = (typeof ROLES)[number];

initializeApp();
setGlobalOptions({ region: REGION, maxInstances: 10 });

const db = getFirestore();
const auth = getAuth();

// ---------- helpers ----------

function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ROLES as readonly string[]).includes(v);
}

function requireSignedIn(req: CallableRequest<unknown>) {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return req.auth;
}

function requireAdmin(req: CallableRequest<unknown>) {
  const a = requireSignedIn(req);
  if (a.token.role !== 'admin') throw new HttpsError('permission-denied', 'Admin only.');
  return a;
}

function audit(
  tx: Transaction | null,
  entry: { actorId: string; action: string; target: string; before: unknown; after: unknown },
) {
  const ref = db.collection('auditLogs').doc();
  const data = { ...entry, at: FieldValue.serverTimestamp() };
  return tx ? tx.set(ref, data) : ref.set(data);
}

async function applyRole(uid: string, role: Role) {
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...(user.customClaims ?? {}), role });
  await db.doc(`users/${uid}`).set({ role, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

// ---------- triggers ----------

/** Creates the profile document and default role for every new account (phone OTP or Google). */
export const onUserCreated = functionsV1
  .region(REGION)
  .auth.user()
  .onCreate(async (user) => {
    const current = await auth.getUser(user.uid);
    const existingRole = current.customClaims?.role;
    const role: Role = isRole(existingRole) ? existingRole : 'buyer';
    if (!isRole(existingRole)) {
      await auth.setCustomUserClaims(user.uid, { ...(current.customClaims ?? {}), role });
    }
    await db.doc(`users/${user.uid}`).set(
      {
        name: user.displayName ?? '',
        phone: user.phoneNumber ?? null,
        email: user.email ?? null,
        role,
        language: 'te',
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    logger.info('Profile created', { uid: user.uid, role });
  });

// ---------- callables ----------

/** A buyer who wants to post a property becomes an owner. Dealers are set by admin (subscription). */
export const becomeOwner = onCall(async (req) => {
  const a = requireSignedIn(req);
  const role = a.token.role;
  if (role === 'owner' || role === 'dealer' || role === 'admin') return { role };
  if (role === 'agent') throw new HttpsError('failed-precondition', 'Agents cannot post properties.');
  await applyRole(a.uid, 'owner');
  await audit(null, { actorId: a.uid, action: 'user.becomeOwner', target: `users/${a.uid}`, before: { role: role ?? null }, after: { role: 'owner' } });
  return { role: 'owner' };
});

/** Admin assigns a role. The user must refresh their ID token to see it. */
export const setUserRole = onCall(async (req) => {
  const a = requireAdmin(req);
  const { uid, role } = (req.data ?? {}) as { uid?: unknown; role?: unknown };
  if (typeof uid !== 'string' || uid.length === 0 || uid.length > 128) {
    throw new HttpsError('invalid-argument', 'uid is required.');
  }
  if (!isRole(role)) throw new HttpsError('invalid-argument', `role must be one of ${ROLES.join(', ')}.`);
  if (uid === a.uid && role !== 'admin') {
    throw new HttpsError('failed-precondition', 'You cannot remove your own admin role.');
  }
  let before: unknown = null;
  try {
    before = (await auth.getUser(uid)).customClaims?.role ?? null;
  } catch {
    throw new HttpsError('not-found', 'User not found.');
  }
  await applyRole(uid, role);
  await audit(null, { actorId: a.uid, action: 'user.setRole', target: `users/${uid}`, before: { role: before }, after: { role } });
  return { uid, role };
});

/** Admin approves or rejects a pending listing. Approval assigns a public code like OL-1001. */
export const reviewProperty = onCall(async (req) => {
  const a = requireAdmin(req);
  const { propertyId, decision, reason } = (req.data ?? {}) as { propertyId?: unknown; decision?: unknown; reason?: unknown };
  if (typeof propertyId !== 'string' || propertyId.length === 0 || propertyId.length > 64) {
    throw new HttpsError('invalid-argument', 'propertyId is required.');
  }
  if (decision !== 'approve' && decision !== 'reject') {
    throw new HttpsError('invalid-argument', 'decision must be "approve" or "reject".');
  }
  if (decision === 'reject' && (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 300)) {
    throw new HttpsError('invalid-argument', 'A rejection reason (3–300 characters) is required.');
  }

  const propertyRef = db.doc(`properties/${propertyId}`);
  const counterRef = db.doc('counters/properties');

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(propertyRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Property not found.');
    const property = snap.data()!;
    if (property.status !== 'pending') {
      throw new HttpsError('failed-precondition', `Only pending listings can be reviewed (status is "${property.status}").`);
    }

    if (decision === 'approve') {
      let code: string | null = typeof property.code === 'string' ? property.code : null;
      if (!code) {
        const counter = await tx.get(counterRef);
        const next = ((counter.exists ? (counter.data()!.seq as number) : 1000) ?? 1000) + 1;
        tx.set(counterRef, { seq: next }, { merge: true });
        code = `OL-${next}`;
      }
      const after = { status: 'approved', code, rejectReason: null };
      tx.update(propertyRef, { ...after, reviewedBy: a.uid, reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      audit(tx, { actorId: a.uid, action: 'property.approve', target: `properties/${propertyId}`, before: { status: property.status }, after });
      return { status: 'approved', code };
    }

    const after = { status: 'rejected', rejectReason: (reason as string).trim() };
    tx.update(propertyRef, { ...after, reviewedBy: a.uid, reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    audit(tx, { actorId: a.uid, action: 'property.reject', target: `properties/${propertyId}`, before: { status: property.status }, after });
    return { status: 'rejected', code: property.code ?? null };
  });
});
