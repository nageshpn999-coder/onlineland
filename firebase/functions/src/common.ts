/**
 * Shared setup and helpers for every OnlineLand Cloud Function.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, type Transaction } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

export const REGION = 'asia-south1';
export const ROLES = ['buyer', 'owner', 'dealer', 'agent', 'admin'] as const;
export type Role = (typeof ROLES)[number];

initializeApp();
setGlobalOptions({ region: REGION, maxInstances: 10 });

export const db = getFirestore();
export const auth = getAuth();

export const DAY_MS = 24 * 60 * 60 * 1000;

export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ROLES as readonly string[]).includes(v);
}

export function requireSignedIn(req: CallableRequest<unknown>) {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return req.auth;
}

export function requireAdmin(req: CallableRequest<unknown>) {
  const a = requireSignedIn(req);
  if (a.token.role !== 'admin') throw new HttpsError('permission-denied', 'Admin only.');
  return a;
}

export function requireId(v: unknown, name: string): string {
  if (typeof v !== 'string' || v.length === 0 || v.length > 128 || v.includes('/')) {
    throw new HttpsError('invalid-argument', `${name} is required.`);
  }
  return v;
}

export function audit(
  tx: Transaction | null,
  entry: { actorId: string; action: string; target: string; before: unknown; after: unknown },
) {
  const ref = db.collection('auditLogs').doc();
  const data = { ...entry, at: FieldValue.serverTimestamp() };
  return tx ? tx.set(ref, data) : ref.set(data);
}

export async function applyRole(uid: string, role: Role) {
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...(user.customClaims ?? {}), role });
  await db.doc(`users/${uid}`).set({ role, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

/** Milliseconds of a Firestore Timestamp (or null). */
export function ms(v: unknown): number | null {
  return v && typeof (v as { toMillis?: unknown }).toMillis === 'function' ? (v as { toMillis(): number }).toMillis() : null;
}

export interface Notice {
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Records a notification for a user and pushes it to their phones.
 * Best effort: callers catch errors so a failed push never undoes their work.
 * The push is skipped in the emulator (no FCM there); the record is still written so tests can see it.
 */
export async function notifyUser(userId: string, n: Notice): Promise<void> {
  await db.collection('notifications').add({
    userId, type: n.type, title: n.title, body: n.body, ...(n.data ?? {}),
    createdAt: FieldValue.serverTimestamp(),
  });
  if (process.env.FUNCTIONS_EMULATOR === 'true') return;
  const devices = await db.collection(`users/${userId}/devices`).get();
  if (devices.empty) return;
  const res = await getMessaging().sendEachForMulticast({
    tokens: devices.docs.map((d) => d.id),
    notification: { title: n.title, body: n.body },
    data: { type: n.type, ...(n.data ?? {}) },
    android: { priority: 'high' },
  });
  // Remove tokens FCM says are no longer valid.
  await Promise.all(res.responses.map((r, i) => {
    const c = r.error?.code;
    return c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token'
      ? devices.docs[i]?.ref.delete() : null;
  }));
}

export function safeNotify(userId: string, n: Notice): Promise<void> {
  return notifyUser(userId, n).catch((err) => logger.warn('notification failed', { userId, type: n.type, err: String(err) }));
}
