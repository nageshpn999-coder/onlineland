/**
 * OnlineLand Cloud Functions.
 *
 * Every privileged action runs here, never in a browser or app:
 *  - onUserCreated   new sign-in → users/{uid} profile + "buyer" role
 *  - becomeOwner     a buyer who wants to post a property becomes an "owner"
 *  - setUserRole     admin assigns any role (dealer, agent, admin…)
 *  - reviewProperty  admin approves or rejects a pending listing (+ audit log, property code,
 *                    listing limits of the owner's plan, push notification to the owner)
 *  - revenue.ts      payments, plans, verified badge, featured slots, stats, dealer leads, daily jobs (Phase 7)
 *
 * This package is deployed on its own, so it does not import @onlineland/shared;
 * tests check that ROLES and the plan defaults match the shared lists.
 */
import { FieldValue, type Transaction } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import * as functionsV1 from 'firebase-functions/v1';
import { logger } from 'firebase-functions';
import { applyRole, audit, auth, db, isRole, ms, REGION, requireAdmin, requireSignedIn, ROLES, safeNotify, type Role } from './common';
import { loadConfig } from './config';

export { REGION, ROLES } from './common';
export * from './revenue';

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

  const config = await loadConfig();
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(propertyRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Property not found.');
    const property = snap.data()!;
    if (property.status !== 'pending') {
      throw new HttpsError('failed-precondition', `Only pending listings can be reviewed (status is "${property.status}").`);
    }

    const ownerId = typeof property.ownerId === 'string' ? property.ownerId : null;

    if (decision === 'approve') {
      if (ownerId) await checkListingLimit(tx, propertyId, property, ownerId, config);
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
      return { status: 'approved', code, ownerId };
    }

    const after = { status: 'rejected', rejectReason: (reason as string).trim() };
    tx.update(propertyRef, { ...after, reviewedBy: a.uid, reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    audit(tx, { actorId: a.uid, action: 'property.reject', target: `properties/${propertyId}`, before: { status: property.status }, after });
    return { status: 'rejected', code: (property.code as string | null) ?? null, ownerId };
  });

  if (result.ownerId) {
    const approved = result.status === 'approved';
    await safeNotify(result.ownerId, {
      type: `property.${result.status}`,
      title: approved ? 'మీ ప్రాపర్టీ ఆమోదించబడింది' : 'మీ ప్రాపర్టీ తిరస్కరించబడింది',
      body: approved
        ? `${result.code ?? ''} ఇప్పుడు OnlineLand లో అందరికీ కనిపిస్తుంది.`.trim()
        : 'కారణం చూడటానికి యాప్‌లో "నా ప్రాపర్టీలు" తెరవండి.',
      data: { propertyId, status: result.status, code: result.code ?? '' },
    });
  }
  return { status: result.status, code: result.code };
});

/**
 * Plan limits (decision D7), checked when a listing is approved:
 *  - OnlineLand's own listings and admins: no limit.
 *  - Dealer with an active plan: plan.listingLimit approved listings at a time (0 = unlimited).
 *  - Dealer without a plan: the Free plan's limit.
 *  - Owner: ownerFreeListings free listings; a listing the owner paid for (listingPaidUntil) does not count.
 */
async function checkListingLimit(
  tx: Transaction,
  propertyId: string,
  property: FirebaseFirestore.DocumentData,
  ownerId: string,
  config: Awaited<ReturnType<typeof loadConfig>>,
): Promise<void> {
  if (property.source === 'onlineland') return;
  const now = Date.now();
  if ((ms(property.listingPaidUntil) ?? 0) > now) return;
  const [ownerUser, dealerSnap] = await Promise.all([
    auth.getUser(ownerId).catch(() => null),
    tx.get(db.doc(`dealers/${ownerId}`)),
  ]);
  if (ownerUser?.customClaims?.role === 'admin') return;

  const dealer = dealerSnap.data();
  const planActive = (ms(dealer?.validUntil) ?? 0) > now;
  let limit: number;
  if (planActive && dealer?.planId && dealer.planId in config.plans) {
    limit = config.plans[dealer.planId as keyof typeof config.plans].listingLimit;
  } else if (property.source === 'dealer') {
    limit = config.plans.free.listingLimit;
  } else {
    limit = config.pricing.ownerFreeListings;
  }
  if (limit === 0) return;

  const approved = await tx.get(db.collection('properties').where('ownerId', '==', ownerId).where('status', '==', 'approved'));
  const counted = approved.docs.filter((d) => d.id !== propertyId && !planActiveOrPaid(d.get('listingPaidUntil'), now, planActive));
  if (counted.length >= limit) {
    throw new HttpsError(
      'failed-precondition',
      `Listing limit reached: this account has ${counted.length} live listing(s) and its plan allows ${limit}. ` +
        'Ask them to pay for this listing or take a plan.',
      { reason: 'limit-reached', live: counted.length, limit },
    );
  }
}

/** Paid owner listings do not use a free slot; for dealers on a plan every live listing counts. */
function planActiveOrPaid(paidUntil: unknown, now: number, dealerPlan: boolean): boolean {
  return !dealerPlan && (ms(paidUntil) ?? 0) > now;
}
