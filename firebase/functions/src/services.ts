/**
 * Phase 9 — more ways to earn.
 *
 *  - onServiceRequestCreated  a fixed-price service gets its price at once (status "quoted") and the customer is told
 *  - quoteService             admin sets the price of a survey/registration/etc. request → customer can pay in the app
 *  - claimLaunchOffer         a new dealer in an offer district takes the free plan once (admin turns the offer on/off)
 */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { applyRole, audit, CALLABLE, db, DAY_MS, ms, requireAdmin, requireId, requireSignedIn, safeNotify } from './common';
import { loadConfig, loadServices } from './config';
import { isServiceId } from './plans';
import { dealerCard, planFields } from './revenue';

const INR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const onServiceRequestCreated = onDocumentCreated('serviceRequests/{id}', async (event) => {
  const r = event.data?.data();
  if (!r || r.status !== 'new' || !isServiceId(r.serviceId)) return;
  const service = (await loadServices())[r.serviceId];
  if (typeof service.priceInr !== 'number' || service.priceInr <= 0) return; // quoted by admin, or free
  await event.data!.ref.update({ status: 'quoted', quotedInr: service.priceInr, updatedAt: FieldValue.serverTimestamp() });
  if (typeof r.userId === 'string') {
    await safeNotify(r.userId, {
      type: 'service.quoted',
      title: `${service.name.te}: ${INR(service.priceInr)}`,
      body: 'యాప్‌లో "సేవలు → నా requests" లో UPI తో చెల్లించండి.',
      data: { serviceRequestId: event.params.id },
    });
  }
});

export const quoteService = onCall(CALLABLE, async (req) => {
  const a = requireAdmin(req);
  const { requestId, amountInr, note } = (req.data ?? {}) as { requestId?: unknown; amountInr?: unknown; note?: unknown };
  const id = requireId(requestId, 'requestId');
  if (typeof amountInr !== 'number' || !Number.isInteger(amountInr) || amountInr < 1 || amountInr > 100000) {
    throw new HttpsError('invalid-argument', 'amountInr must be a whole number from 1 to 100000.');
  }
  if (note != null && (typeof note !== 'string' || note.length > 500)) throw new HttpsError('invalid-argument', 'note is up to 500 characters.');
  const ref = db.doc(`serviceRequests/${id}`);
  const r = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Request not found.');
    const d = snap.data()!;
    if (!['new', 'quoted'].includes(d.status)) throw new HttpsError('failed-precondition', `This request is already ${d.status}.`);
    tx.update(ref, { status: 'quoted', quotedInr: amountInr, adminNote: (note as string | undefined)?.trim() || null, updatedAt: FieldValue.serverTimestamp() });
    audit(tx, { actorId: a.uid, action: 'service.quote', target: `serviceRequests/${id}`, before: { status: d.status, quotedInr: d.quotedInr ?? null }, after: { status: 'quoted', quotedInr: amountInr } });
    return d;
  });
  if (typeof r.userId === 'string') {
    const name = isServiceId(r.serviceId) ? (await loadServices())[r.serviceId].name.te : 'సేవ';
    await safeNotify(r.userId, {
      type: 'service.quoted',
      title: `${name}: ${INR(amountInr)}`,
      body: 'యాప్‌లో "సేవలు → నా requests" లో UPI తో చెల్లించండి.',
      data: { serviceRequestId: id },
    });
  }
  return { status: 'quoted', quotedInr: amountInr };
});

export const claimLaunchOffer = onCall(CALLABLE, async (req) => {
  const a = requireSignedIn(req);
  const district = (req.data as { district?: unknown } | null)?.district;
  if (typeof district !== 'string' || !/^[a-z0-9-]{2,40}$/.test(district)) throw new HttpsError('invalid-argument', 'Choose your district.');
  const { plans, pricing } = await loadConfig();
  if (!pricing.launchOfferActive) throw new HttpsError('failed-precondition', 'The offer is not running now.');
  if (pricing.launchOfferDistricts.length > 0 && !pricing.launchOfferDistricts.includes(district)) {
    throw new HttpsError('failed-precondition', 'The offer is not available in this district yet.');
  }
  const role = a.token.role as string | undefined;
  if (role === 'admin' || role === 'agent') throw new HttpsError('failed-precondition', 'Staff accounts cannot take the offer.');
  const planId = pricing.launchOfferPlan;
  const plan = plans[planId];
  const now = Date.now();
  const until = now + pricing.launchOfferDays * DAY_MS;
  const card = await dealerCard(a.uid);

  await db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${a.uid}`);
    const dealerRef = db.doc(`dealers/${a.uid}`);
    const [user, dealer] = await Promise.all([tx.get(userRef), tx.get(dealerRef)]);
    if (user.get('launchOfferAt')) throw new HttpsError('already-exists', 'The offer was already used on this account.');
    if ((ms(dealer.get('validUntil')) ?? 0) > now) throw new HttpsError('failed-precondition', 'You already have an active plan.');
    tx.set(dealerRef, {
      name: card.name,
      phone: plan.ownContact ? card.phone : null,
      verified: dealer.get('verified') ?? false,
      ...planFields(planId, plan),
      validUntil: Timestamp.fromMillis(until),
      featuredUsed: 0,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    tx.set(userRef, { launchOfferAt: FieldValue.serverTimestamp(), launchOfferDistrict: district }, { merge: true });
    tx.set(db.collection('subscriptions').doc(), {
      dealerId: a.uid, planId, billing: 'offer', method: 'launch-offer', upiReference: null, amountInr: 0,
      status: 'active', validUntil: Timestamp.fromMillis(until), confirmedBy: null, paymentId: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    audit(tx, { actorId: a.uid, action: 'plan.launchOffer', target: `dealers/${a.uid}`, before: null, after: { planId, district, until: new Date(until).toISOString() } });
  });

  if (role === 'buyer' || role === 'owner' || role === undefined) {
    await applyRole(a.uid, 'dealer');
  }
  const date = new Date(until).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  await safeNotify(a.uid, { type: 'plan.offer', title: `${plan.name.te} ప్లాన్ ఉచితం 🎉`, body: `${date} వరకు active. డీలర్‌గా ప్రాపర్టీలు పెట్టండి.` });
  // The role is in the ID token; the app refreshes it after this call.
  return { planId, validUntil: until };
});
