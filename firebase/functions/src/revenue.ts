/**
 * Phase 7 — revenue and dealer features (decisions D6, D7).
 *
 *  - reviewPayment     admin approves/rejects a UPI payment → activates a plan, a featured week or a paid listing
 *  - setVerified       admin gives/removes the ✓ Verified badge
 *  - useFeaturedSlot   a Pro dealer puts one of their live listings on top (featured slots in the plan)
 *  - trackEvent        counts listing views and WhatsApp shares (public)
 *  - onLeadCreated     counts enquiries; tells the dealer when their share link brought one
 *  - dailyMaintenance  09:00 IST: renewal reminders, end featured weeks, expire paid owner listings
 *  - runMaintenance    admin can run the same job now (and tests use it)
 */
import { FieldValue, Timestamp, type DocumentReference } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { applyRole, audit, auth, CALLABLE, db, DAY_MS, ms, requireAdmin, requireId, requireSignedIn, safeNotify } from './common';
import { loadConfig } from './config';
import { isPlanId, YEAR_DAYS, type PlanConfig, type PlanId } from './plans';

const INR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Public dealer card. Phone is published only while the plan includes ownContact. */
export async function dealerCard(uid: string) {
  const [userSnap, user] = await Promise.all([db.doc(`users/${uid}`).get(), auth.getUser(uid).catch(() => null)]);
  const name = (userSnap.get('name') as string | undefined)?.trim() || user?.displayName || '';
  const phone = (userSnap.get('phone') as string | null | undefined) ?? user?.phoneNumber ?? null;
  return { name, phone: phone ? phone.replace(/^\+91/, '') : null };
}

export function planFields(planId: PlanId, plan: PlanConfig) {
  return {
    planId,
    ownContact: plan.ownContact,
    dealerPage: plan.dealerPage,
    featuredSlots: plan.featuredSlots,
  };
}

// ---------------------------------------------------------------- payments

export const reviewPayment = onCall(CALLABLE, async (req) => {
  const a = requireAdmin(req);
  const { paymentId, decision, reason } = (req.data ?? {}) as { paymentId?: unknown; decision?: unknown; reason?: unknown };
  const id = requireId(paymentId, 'paymentId');
  if (decision !== 'approve' && decision !== 'reject') {
    throw new HttpsError('invalid-argument', 'decision must be "approve" or "reject".');
  }
  if (decision === 'reject' && (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 300)) {
    throw new HttpsError('invalid-argument', 'A rejection reason (3–300 characters) is required.');
  }

  const { plans, pricing } = await loadConfig();
  const payRef = db.doc(`paymentRequests/${id}`);
  const now = Date.now();

  const outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(payRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Payment not found.');
    const p = snap.data()!;
    if (p.status !== 'pending') throw new HttpsError('failed-precondition', `This payment is already ${p.status}.`);
    const userId = p.userId as string;
    const review = { reviewedBy: a.uid, reviewedAt: FieldValue.serverTimestamp() };

    if (decision === 'reject') {
      const rejectReason = (reason as string).trim();
      tx.update(payRef, { status: 'rejected', rejectReason, ...review });
      audit(tx, { actorId: a.uid, action: 'payment.reject', target: `paymentRequests/${id}`, before: { status: 'pending' }, after: { status: 'rejected', rejectReason } });
      return { userId, kind: p.kind as string, status: 'rejected' as const, until: null as number | null, reason: rejectReason, planId: null as PlanId | null };
    }

    // ---- approve
    let until: number;
    let planId: PlanId | null = null;
    if (p.kind === 'plan') {
      if (!isPlanId(p.planId) || p.planId === 'free') throw new HttpsError('failed-precondition', 'Unknown plan.');
      planId = p.planId;
      const plan = plans[planId];
      const yearly = p.billing === 'year';
      const price = yearly ? plan.yearlyPriceInr : plan.priceInr;
      if (yearly && !(price > 0)) throw new HttpsError('failed-precondition', `${plan.name.en} has no yearly price.`);
      if (p.amountInr < price) {
        throw new HttpsError('failed-precondition', `Amount ${INR(p.amountInr)} is less than the ${plan.name.en} price ${INR(price)}.`);
      }
      const days = yearly ? YEAR_DAYS : plan.durationDays;
      const dealerRef = db.doc(`dealers/${userId}`);
      const dealer = (await tx.get(dealerRef)).data();
      const current = ms(dealer?.validUntil) ?? 0;
      // Renewing the same plan early adds to the remaining days; a new or changed plan starts today.
      const samePlanRunning = current > now && dealer?.planId === planId;
      until = (samePlanRunning ? current : now) + days * DAY_MS;
      const card = await dealerCard(userId);
      tx.set(dealerRef, {
        name: card.name,
        phone: plan.ownContact ? card.phone : null,
        verified: dealer?.verified ?? false,
        ...planFields(planId, plan),
        validUntil: Timestamp.fromMillis(until),
        featuredUsed: samePlanRunning ? (dealer?.featuredUsed ?? 0) : 0,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      tx.set(db.collection('subscriptions').doc(), {
        dealerId: userId, planId, billing: yearly ? 'year' : 'month', method: 'manual-upi', upiReference: p.utr, amountInr: p.amountInr,
        status: 'active', validUntil: Timestamp.fromMillis(until), confirmedBy: a.uid, paymentId: id,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else if (p.kind === 'service') {
      const srRef = db.doc(`serviceRequests/${requireId(p.serviceRequestId, 'serviceRequestId')}`);
      const sr = (await tx.get(srRef)).data();
      if (!sr || sr.userId !== userId) throw new HttpsError('failed-precondition', 'The service request does not belong to this user.');
      if (sr.status !== 'quoted') throw new HttpsError('failed-precondition', `The service request is ${sr.status}.`);
      if (typeof sr.quotedInr !== 'number' || p.amountInr < sr.quotedInr) {
        throw new HttpsError('failed-precondition', `The quoted price is ${INR(sr.quotedInr ?? 0)}.`);
      }
      until = now;
      tx.update(srRef, { status: 'paid', paymentId: id, updatedAt: FieldValue.serverTimestamp() });
    } else {
      const propertyId = requireId(p.propertyId, 'propertyId');
      const propRef = db.doc(`properties/${propertyId}`);
      const prop = (await tx.get(propRef)).data();
      if (!prop || prop.ownerId !== userId) throw new HttpsError('failed-precondition', 'The listing no longer belongs to this user.');
      if (p.kind === 'featured') {
        if (p.amountInr < pricing.featuredWeekInr) throw new HttpsError('failed-precondition', `Featured costs ${INR(pricing.featuredWeekInr)}.`);
        const from = Math.max(now, ms(prop.featuredUntil) ?? 0);
        until = from + pricing.featuredDays * DAY_MS;
        tx.update(propRef, { isFeatured: true, featuredUntil: Timestamp.fromMillis(until), updatedAt: FieldValue.serverTimestamp() });
      } else if (p.kind === 'listing') {
        if (p.amountInr < pricing.ownerListingInr) throw new HttpsError('failed-precondition', `A listing costs ${INR(pricing.ownerListingInr)}.`);
        until = now + pricing.ownerListingDays * DAY_MS;
        tx.update(propRef, { listingPaidUntil: Timestamp.fromMillis(until), updatedAt: FieldValue.serverTimestamp() });
      } else {
        throw new HttpsError('failed-precondition', 'Unknown payment kind.');
      }
    }

    tx.update(payRef, { status: 'approved', ...review });
    audit(tx, {
      actorId: a.uid, action: `payment.approve.${p.kind}`, target: `paymentRequests/${id}`,
      before: { status: 'pending' }, after: { status: 'approved', planId, billing: p.billing ?? null, propertyId: p.propertyId ?? null, serviceRequestId: p.serviceRequestId ?? null, until: new Date(until).toISOString() },
    });
    return { userId, kind: p.kind as string, status: 'approved' as const, until, reason: null, planId };
  });

  // A paid plan makes a buyer/owner a dealer (they can post as a dealer from now on).
  if (outcome.status === 'approved' && outcome.kind === 'plan') {
    const role = (await auth.getUser(outcome.userId).catch(() => null))?.customClaims?.role;
    if (role === 'buyer' || role === 'owner' || role === undefined) {
      await applyRole(outcome.userId, 'dealer');
      await audit(null, { actorId: a.uid, action: 'user.setRole', target: `users/${outcome.userId}`, before: { role: role ?? null }, after: { role: 'dealer' } });
    }
  }

  const date = outcome.until ? new Date(outcome.until).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';
  await safeNotify(outcome.userId, outcome.status === 'approved'
    ? {
        type: `payment.approved`,
        title: 'చెల్లింపు ఆమోదించబడింది ✅',
        body: outcome.kind === 'plan'
          ? `మీ ${plans[outcome.planId!].name.te} ప్లాన్ ${date} వరకు active.`
          : outcome.kind === 'featured' ? `మీ ప్రాపర్టీ ${date} వరకు పైన కనిపిస్తుంది.`
          : outcome.kind === 'service' ? 'మా టీమ్ త్వరలో మీకు కాల్ చేసి పని మొదలుపెడుతుంది.'
          : `మీ ప్రాపర్టీ ${date} వరకు live లో ఉంటుంది.`,
        data: { paymentId: id, kind: outcome.kind },
      }
    : {
        type: 'payment.rejected',
        title: 'చెల్లింపు ఆమోదించబడలేదు',
        body: `కారణం: ${outcome.reason}`,
        data: { paymentId: id, kind: outcome.kind },
      });
  return { status: outcome.status, validUntil: outcome.until };
});

// ---------------------------------------------------------------- verified badge

export const setVerified = onCall(CALLABLE, async (req) => {
  const a = requireAdmin(req);
  const { uid, verified } = (req.data ?? {}) as { uid?: unknown; verified?: unknown };
  const id = requireId(uid, 'uid');
  if (typeof verified !== 'boolean') throw new HttpsError('invalid-argument', 'verified must be true or false.');
  const user = await auth.getUser(id).catch(() => null);
  if (!user) throw new HttpsError('not-found', 'User not found.');

  const ref = db.doc(`dealers/${id}`);
  const before = (await ref.get()).data();
  const card = await dealerCard(id);
  const active = (ms(before?.validUntil) ?? 0) > Date.now() && before?.ownContact === true;
  await ref.set({
    name: card.name,
    phone: active ? card.phone : null,
    verified,
    planId: before?.planId ?? 'free',
    validUntil: before?.validUntil ?? null,
    ownContact: before?.ownContact ?? false,
    dealerPage: before?.dealerPage ?? false,
    featuredSlots: before?.featuredSlots ?? 0,
    featuredUsed: before?.featuredUsed ?? 0,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await audit(null, { actorId: a.uid, action: 'dealer.setVerified', target: `dealers/${id}`, before: { verified: before?.verified ?? false }, after: { verified } });
  if (verified) {
    await safeNotify(id, { type: 'dealer.verified', title: 'మీకు ✓ Verified బ్యాడ్జ్ వచ్చింది', body: 'ఇప్పుడు మీ ప్రాపర్టీల మీద ✓ గుర్తు కనిపిస్తుంది.' });
  }
  return { uid: id, verified };
});

// ---------------------------------------------------------------- featured slots (Pro)

export const useFeaturedSlot = onCall(CALLABLE, async (req) => {
  const a = requireSignedIn(req);
  const propertyId = requireId((req.data as { propertyId?: unknown } | null)?.propertyId, 'propertyId');
  const { pricing } = await loadConfig();
  const now = Date.now();
  return db.runTransaction(async (tx) => {
    const dealerRef = db.doc(`dealers/${a.uid}`);
    const propRef = db.doc(`properties/${propertyId}`);
    const [dealerSnap, propSnap] = await Promise.all([tx.get(dealerRef), tx.get(propRef)]);
    const dealer = dealerSnap.data();
    const prop = propSnap.data();
    if (!prop || prop.ownerId !== a.uid) throw new HttpsError('permission-denied', 'Not your listing.');
    if (prop.status !== 'approved') throw new HttpsError('failed-precondition', 'Only live listings can be featured.');
    if (!dealer || (ms(dealer.validUntil) ?? 0) <= now) throw new HttpsError('failed-precondition', 'Your plan is not active.');
    const slots = (dealer.featuredSlots as number) ?? 0;
    const used = (dealer.featuredUsed as number) ?? 0;
    if (used >= slots) throw new HttpsError('resource-exhausted', `All ${slots} featured slots of this plan period are used.`);
    const until = Math.max(now, ms(prop.featuredUntil) ?? 0) + pricing.featuredDays * DAY_MS;
    tx.update(propRef, { isFeatured: true, featuredUntil: Timestamp.fromMillis(until), updatedAt: FieldValue.serverTimestamp() });
    tx.update(dealerRef, { featuredUsed: used + 1, updatedAt: FieldValue.serverTimestamp() });
    audit(tx, { actorId: a.uid, action: 'property.featureSlot', target: `properties/${propertyId}`, before: { featuredUsed: used }, after: { featuredUsed: used + 1, until: new Date(until).toISOString() } });
    return { featuredUntil: until, slotsLeft: slots - used - 1 };
  });
});

// ---------------------------------------------------------------- stats

/** Public: counts a view or a WhatsApp share of a live listing. */
export const trackEvent = onCall(CALLABLE, async (req) => {
  const { propertyId, type } = (req.data ?? {}) as { propertyId?: unknown; type?: unknown };
  const id = requireId(propertyId, 'propertyId');
  if (type !== 'view' && type !== 'share') throw new HttpsError('invalid-argument', 'type must be "view" or "share".');
  const prop = await db.doc(`properties/${id}`).get();
  if (!prop.exists || prop.get('status') !== 'approved') return { ok: false };
  await db.doc(`propertyStats/${id}`).set({ [type === 'view' ? 'views' : 'shares']: FieldValue.increment(1) }, { merge: true });
  return { ok: true };
});

/** Every new enquiry: count it, and tell the dealer if their share link brought it. */
export const onLeadCreated = onDocumentCreated('leads/{leadId}', async (event) => {
  const lead = event.data?.data();
  if (!lead) return;
  const propertyId = typeof lead.propertyId === 'string' ? lead.propertyId : null;
  if (propertyId) {
    await db.doc(`propertyStats/${propertyId}`).set({ leads: FieldValue.increment(1) }, { merge: true });
  }
  const refId = typeof lead.refId === 'string' ? lead.refId : null;
  if (!refId || !propertyId) return;
  const dealer = (await db.doc(`dealers/${refId}`).get()).data();
  if (!dealer || dealer.ownContact !== true || (ms(dealer.validUntil) ?? 0) <= Date.now()) return;
  const prop = await db.doc(`properties/${propertyId}`).get();
  await safeNotify(refId, {
    type: 'lead.new',
    title: 'కొత్త enquiry వచ్చింది 📩',
    body: `${lead.name || lead.phone || 'ఒక కస్టమర్'} — ${prop.get('code') ?? ''}`.trim(),
    data: { leadId: event.params.leadId, propertyId },
  });
});

// ---------------------------------------------------------------- daily job

/** Renewal reminders, end of featured weeks, expiry of paid owner listings. Safe to run more than once a day. */
export async function maintenance(nowMs = Date.now()) {
  const { pricing } = await loadConfig();
  const now = Timestamp.fromMillis(nowMs);
  let reminded = 0;
  let unfeatured = 0;
  let expired = 0;

  // 1. Plans ending within the reminder window that have not been reminded for this period yet.
  const soon = Timestamp.fromMillis(nowMs + pricing.renewalReminderDays * DAY_MS);
  const ending = await db.collection('dealers').where('validUntil', '>', now).where('validUntil', '<=', soon).get();
  for (const d of ending.docs) {
    const until = ms(d.get('validUntil'))!;
    if (ms(d.get('remindedFor')) === until) continue;
    const date = new Date(until).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    await safeNotify(d.id, {
      type: 'plan.renew',
      title: 'మీ ప్లాన్ త్వరలో ముగుస్తుంది',
      body: `${date} తో ముగుస్తుంది. యాప్‌లో "నా ప్లాన్" లో renew చేయండి.`,
    });
    await d.ref.update({ remindedFor: d.get('validUntil') });
    reminded++;
  }

  // 2. Featured weeks that are over.
  const featured = await db.collection('properties').where('isFeatured', '==', true).where('featuredUntil', '<=', now).get();
  await commitInBatches(featured.docs.map((d) => d.ref), { isFeatured: false, updatedAt: FieldValue.serverTimestamp() });
  unfeatured = featured.size;

  // 3. Paid owner listings past their period (they stay until sold or the period ends — D7).
  const paid = await db.collection('properties').where('status', '==', 'approved').where('listingPaidUntil', '<=', now).get();
  await commitInBatches(paid.docs.map((d) => d.ref), { status: 'expired', updatedAt: FieldValue.serverTimestamp() });
  expired = paid.size;
  for (const d of paid.docs) {
    await safeNotify(d.get('ownerId'), {
      type: 'property.expired',
      title: 'మీ ప్రాపర్టీ గడువు ముగిసింది',
      body: `${d.get('code') ?? ''} ఇప్పుడు సైట్‌లో కనిపించదు. మళ్లీ పెట్టాలంటే యాప్‌లో renew చేయండి.`.trim(),
      data: { propertyId: d.id },
    });
  }

  logger.info('maintenance', { reminded, unfeatured, expired });
  return { reminded, unfeatured, expired };
}

async function commitInBatches(refs: DocumentReference[], data: Record<string, unknown>) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = db.batch();
    refs.slice(i, i + 400).forEach((r) => batch.update(r, data));
    await batch.commit();
  }
}

export const dailyMaintenance = onSchedule({ schedule: 'every day 09:00', timeZone: 'Asia/Kolkata' }, async () => {
  await maintenance();
});

/** Admin "run now" (also used by tests). */
export const runMaintenance = onCall(CALLABLE, async (req) => {
  const a = requireAdmin(req);
  const { nowMs } = (req.data ?? {}) as { nowMs?: unknown };
  // Tests in the emulator may pass a future time to simulate expiry; production always uses the real clock.
  const at = process.env.FUNCTIONS_EMULATOR === 'true' && typeof nowMs === 'number' ? nowMs : Date.now();
  const res = await maintenance(at);
  await audit(null, { actorId: a.uid, action: 'maintenance.run', target: 'system', before: null, after: res });
  return res;
});

// ---------------------------------------------------------------- account deletion (Play Store / DPDP Act)

/**
 * The signed-in user deletes their own account: profile, favourites, device tokens, dealer card,
 * their listings taken off the site (owner contact deleted), then the login itself.
 * Kept for legal accounting: payment records, subscriptions, audit logs. Admins cannot delete themselves.
 */
export const deleteMyAccount = onCall(CALLABLE, async (req) => {
  const a = requireSignedIn(req);
  if (a.token.role === 'admin') throw new HttpsError('failed-precondition', 'Admins cannot delete their own account.');
  const uid = a.uid;

  const [favs, devices, props] = await Promise.all([
    db.collection(`users/${uid}/favorites`).listDocuments(),
    db.collection(`users/${uid}/devices`).listDocuments(),
    db.collection('properties').where('ownerId', '==', uid).get(),
  ]);
  const deletes: DocumentReference[] = [...favs, ...devices, db.doc(`dealers/${uid}`), db.doc(`users/${uid}`)];
  for (const p of props.docs) deletes.push(db.doc(`properties/${p.id}/private/contact`));
  for (let i = 0; i < deletes.length; i += 400) {
    const batch = db.batch();
    deletes.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
  const live = props.docs.filter((p) => ['draft', 'pending', 'approved'].includes(p.get('status')));
  await commitInBatches(live.map((p) => p.ref), { status: 'expired', isFeatured: false, updatedAt: FieldValue.serverTimestamp() });
  await audit(null, {
    actorId: uid, action: 'user.deleteAccount', target: `users/${uid}`,
    before: { listings: props.size }, after: { deleted: true, listingsTakenDown: live.length },
  });
  await auth.deleteUser(uid);
  return { deleted: true, listingsTakenDown: live.length };
});
