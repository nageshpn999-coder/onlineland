#!/usr/bin/env node
// Seeds the LOCAL EMULATORS with locations and TEST listings for development and browser tests.
// Refuses to run unless the Firestore emulator is in use and the project is a demo-* project,
// so it can never write to a real Firebase project.
//
//   npx firebase emulators:exec --config firebase/firebase.json --project demo-onlineland "node scripts/seed-emulator.mjs"

import { deflateSync } from 'node:zlib';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const PROJECT = process.env.GCLOUD_PROJECT || 'demo-onlineland';
if (!process.env.FIRESTORE_EMULATOR_HOST || !PROJECT.startsWith('demo-')) {
  console.error('✘ seed-emulator only runs against the Firebase emulators (demo-* project). Nothing written.');
  process.exit(1);
}

const app = initializeApp({ projectId: PROJECT, storageBucket: `${PROJECT}.appspot.com` });
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

// ---------- locations (imported from the shared package source) ----------
// Node 22.18+ runs TypeScript files directly (type stripping), so the shared list is the single source.
const { TELANGANA_DISTRICTS, MANDALS } = await import('../packages/shared/src/locations.ts');

const batch = db.batch();
for (const d of TELANGANA_DISTRICTS) {
  batch.set(db.doc(`locations/${d.id}`), { name: d.name, level: 'district', parentId: null });
}
for (const [districtId, mandals] of Object.entries(MANDALS)) {
  for (const m of mandals) {
    batch.set(db.doc(`locations/${districtId}--${m.id}`), { name: m.name, level: 'mandal', parentId: districtId });
  }
}
await batch.commit();

// ---------- test photos (generated PNGs, no external files) ----------
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
/** Simple landscape: sky band over field rows, colour varies per photo. */
function landscapePng(w, h, seed) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = y * (w * 3 + 1) + 1 + x * 3;
      const horizon = h * (0.35 + 0.05 * seed);
      let r, g, b;
      if (y < horizon) {
        const t = y / horizon;
        [r, g, b] = [200 - 60 * t, 220 - 40 * t, 245];
      } else {
        const row = Math.floor((y - horizon + x * 0.4 * (seed + 1)) / 18) % 2;
        [r, g, b] = row ? [70 + seed * 20, 130 + seed * 10, 60] : [95 + seed * 20, 155, 80];
      }
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- test listings ----------
const DAY = 86_400_000;
const now = Date.now();
const base = {
  description: { te: '', en: '' },
  facing: null,
  roadAccess: null,
  waterSource: null,
  rera: null,
  coverPath: null,
  photoCount: 0,
  ownerId: 'seed-owner',
  source: 'onlineland',
  status: 'approved',
  isFeatured: false,
  featuredUntil: null,
  docsVerified: false,
  rejectReason: null,
  reviewedBy: 'seed-admin',
};
const loc = (district, mandal, village, lat = null, lng = null) => ({ district, mandal, village, lat, lng });

const listings = [
  {
    id: 'seed-1001', code: 'OL-1001', category: 'agricultural', purpose: 'sale', isFeatured: true, docsVerified: true,
    title: { te: 'బోర్‌వెల్ ఉన్న వ్యవసాయ భూమి', en: 'Farmland with borewell' },
    description: {
      te: 'మక్తల్ నుంచి 4 కి.మీ. దూరంలో ఎర్ర నేల. రెండు బోర్‌వెల్స్, మట్టి రోడ్డు సౌకర్యం. పత్రాలు సిద్ధంగా ఉన్నాయి.',
      en: 'Red soil, 4 km from Makthal. Two borewells and a mud road to the field. Documents ready.',
    },
    price: 1_400_000, priceBasis: 'per-unit', area: 5, areaUnit: 'acre',
    location: loc('narayanpet', 'makthal', 'Makthal', 16.5007, 77.5126),
    facing: 'east', roadAccess: true, waterSource: 'Borewell', photos: 3, age: 1,
  },
  { id: 'seed-1002', code: 'OL-1002', category: 'open-plot', purpose: 'sale', title: { te: 'తూర్పు ముఖ ఓపెన్ ప్లాట్', en: 'East-facing open plot' },
    price: 1_600_000, priceBasis: 'total', area: 200, areaUnit: 'sq-yd', location: loc('narayanpet', 'makthal', 'Makthal town'), facing: 'east', roadAccess: true, age: 2 },
  { id: 'seed-1003', code: 'OL-1003', category: 'agricultural', purpose: 'sale', title: { te: 'కాలువ పక్కన వ్యవసాయ భూమి', en: 'Farmland next to the canal' },
    price: 1_200_000, priceBasis: 'per-unit', area: 10, areaUnit: 'acre', location: loc('narayanpet', 'maganoor', 'Maganoor'), age: 3 },
  { id: 'seed-1004', code: 'OL-1004', category: 'agricultural', purpose: 'sale', title: { te: 'చిన్న రైతుకు 2 ఎకరాలు', en: '2 acres for a small farmer' },
    price: 900_000, priceBasis: 'per-unit', area: 2, areaUnit: 'acre', location: loc('narayanpet', 'utkoor', 'Utkoor'), age: 4 },
  { id: 'seed-1005', code: 'OL-1005', category: 'farmhouse', purpose: 'sale', title: { te: 'మామిడి తోటతో ఫామ్‌హౌస్', en: 'Farmhouse with mango orchard' },
    price: 12_000_000, priceBasis: 'total', area: 1, areaUnit: 'acre', location: loc('rangareddy', 'Shadnagar', 'Shadnagar'), age: 5 },
  { id: 'seed-1006', code: 'OL-1006', category: 'flat', purpose: 'sale', title: { te: '2BHK ఫ్లాట్, గేటెడ్ కమ్యూనిటీ', en: '2BHK flat in a gated community' },
    price: 6_800_000, priceBasis: 'total', area: 1150, areaUnit: 'sq-ft', location: loc('medchal-malkajgiri', 'Kukatpally', 'Kukatpally'), age: 6 },
  { id: 'seed-1007', code: 'OL-1007', category: 'villa', purpose: 'sale', title: { te: '4BHK విల్లా', en: '4BHK villa' },
    price: 24_000_000, priceBasis: 'total', area: 300, areaUnit: 'sq-yd', location: loc('sangareddy', 'Ramachandrapuram', 'Tellapur'), age: 7 },
  { id: 'seed-1008', code: 'OL-1008', category: 'rental', purpose: 'rent', title: { te: '2BHK ఇండిపెండెంట్ ఇల్లు', en: '2BHK independent house' },
    price: 9_000, priceBasis: 'per-month', area: 900, areaUnit: 'sq-ft', location: loc('mahabubnagar', 'Mahabubnagar', 'Mahabubnagar town'), age: 8 },
  { id: 'seed-1009', code: 'OL-1009', category: 'commercial', purpose: 'sale', title: { te: 'మెయిన్ రోడ్డు పై వాణిజ్య స్థలం', en: 'Commercial plot on the main road' },
    price: 9_000_000, priceBasis: 'total', area: 400, areaUnit: 'sq-yd', location: loc('mahabubnagar', 'Mahabubnagar', 'Mahabubnagar town'), roadAccess: true, age: 9 },
  { id: 'seed-1010', code: 'OL-1010', category: 'open-plot', purpose: 'sale', title: { te: 'నారాయణపేట టౌన్‌లో ప్లాట్', en: 'Plot in Narayanpet town' },
    price: 900_000, priceBasis: 'total', area: 150, areaUnit: 'sq-yd', location: loc('narayanpet', 'narayanpet', 'Narayanpet town'), age: 10,
    ownerId: 'seed-pro', source: 'dealer' }, // a Pro dealer's listing (share links, dealer page)
  // Must never appear on the website:
  { id: 'seed-pending', code: null, status: 'pending', category: 'agricultural', purpose: 'sale', title: { te: 'పెండింగ్ ఆస్తి', en: 'Pending listing (hidden)' },
    price: 500_000, priceBasis: 'per-unit', area: 3, areaUnit: 'acre', location: loc('narayanpet', 'makthal', 'Makthal'), reviewedBy: null, age: 0 },
  { id: 'seed-sold', code: 'OL-0999', status: 'sold', category: 'open-plot', purpose: 'sale', title: { te: 'అమ్ముడైన ప్లాట్', en: 'Sold plot (hidden)' },
    price: 700_000, priceBasis: 'total', area: 100, areaUnit: 'sq-yd', location: loc('narayanpet', 'makthal', 'Makthal'), age: 20 },
];

for (const { id, photos = 0, age, ...l } of listings) {
  const createdAt = Timestamp.fromMillis(now - age * DAY);
  const doc = { ...base, ...l, createdAt, updatedAt: createdAt, reviewedAt: l.status && l.status !== 'approved' ? null : createdAt };
  if (photos > 0) {
    const paths = [];
    for (let i = 0; i < photos; i++) {
      const path = `properties/${id}/photo-${i + 1}.png`;
      await bucket.file(path).save(landscapePng(800, 600, i), { contentType: 'image/png', resumable: false });
      await db.doc(`properties/${id}/media/m${i + 1}`).set({ storagePath: path, order: i, isCover: i === 0, createdAt });
      paths.push(path);
    }
    doc.coverPath = paths[0];
    doc.photoCount = photos;
  }
  await db.doc(`properties/${id}`).set(doc);
}
await db.doc('counters/properties').set({ seq: 1010 });

// Videos: OL-1001 has a YouTube link; OL-1002 an uploaded MP4 (placeholder bytes — tests check the player, not playback).
{
  const at = Timestamp.fromMillis(now - DAY);
  await db.doc('properties/seed-1001/media/y1').set({ type: 'youtube', storagePath: null, youtubeId: 'dQw4w9WgXcQ', order: 10, isCover: false, createdAt: at });
  const vpath = 'properties/seed-1002/videos/walkthrough.mp4';
  await bucket.file(vpath).save(Buffer.alloc(2048), { contentType: 'video/mp4', resumable: false });
  const ppath = 'properties/seed-1002/videos/walkthrough.jpg';
  await bucket.file(ppath).save(landscapePng(640, 360, 2), { contentType: 'image/jpeg', resumable: false });
  await db.doc('properties/seed-1002/media/v1').set({ type: 'video', storagePath: vpath, posterPath: ppath, durationSec: 75, order: 10, isCover: false, createdAt: at });
}

// ---------- admin dashboard test data (Phase 7): staff, a dealer, payments, leads, visits ----------
const seededUsers = [];
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  const auth = getAuth(app);
  // With the functions emulator running, onUserCreated fires for each new account; wait for it so it
  // cannot overwrite the role we set below.
  const withFunctions = process.env.SEED_WITH_FUNCTIONS === '1';
  async function seedUser(uid, phone, name, role) {
    await auth.createUser({ uid, phoneNumber: phone, displayName: name });
    if (withFunctions) {
      for (let i = 0; i < 60 && !(await db.doc(`users/${uid}`).get()).exists; i++) await new Promise((r) => setTimeout(r, 250));
    }
    await auth.setCustomUserClaims(uid, { role });
    await db.doc(`users/${uid}`).set({ name, phone, email: null, role, language: 'te', status: 'active', createdAt: Timestamp.fromMillis(now - DAY) });
    seededUsers.push(`${role} ${phone}`);
  }
  await seedUser('seed-admin', '+919000000009', 'Nagesh (admin)', 'admin');
  await seedUser('seed-dealer', '+919000000101', 'Ravi Properties', 'dealer');
  await seedUser('seed-buyer', '+919000000202', 'Suresh', 'buyer');
  await seedUser('seed-agent', '+919000000303', 'Kiran (agent)', 'agent');
  await seedUser('seed-pro', '+919000000404', 'Sai Estates', 'dealer');
  await db.doc('dealers/seed-pro').set({
    name: 'Sai Estates', phone: '9000000404', verified: true, planId: 'pro', validUntil: Timestamp.fromMillis(now + 20 * DAY),
    ownContact: true, dealerPage: true, featuredSlots: 2, featuredUsed: 0, updatedAt: Timestamp.fromMillis(now),
  });

  await db.doc('properties/seed-pending-2').set({
    ...base, ownerId: 'seed-dealer', source: 'dealer', status: 'pending', code: null, reviewedBy: null, reviewedAt: null,
    category: 'open-plot', purpose: 'sale', title: { te: 'డీలర్ ప్లాట్ (పెండింగ్)', en: 'Dealer plot (pending)' },
    price: 800_000, priceBasis: 'total', area: 120, areaUnit: 'sq-yd', location: loc('narayanpet', 'makthal', 'Makthal'),
    createdAt: Timestamp.fromMillis(now - DAY / 2), updatedAt: Timestamp.fromMillis(now - DAY / 2),
  });
  await db.doc('properties/seed-pending-2/private/contact').set({ ownerName: 'Ravi', ownerPhone: '9000000101', address: null, commissionTerms: '2%' });
  await db.doc('paymentRequests/seed-pay-1').set({
    userId: 'seed-dealer', kind: 'plan', planId: 'basic', propertyId: null, amountInr: 499, utr: '412345678901',
    status: 'pending', rejectReason: null, reviewedBy: null, reviewedAt: null, createdAt: Timestamp.fromMillis(now - 3600_000),
  });
  const lead = (id, data, ageH) => db.doc(`leads/${id}`).set({
    propertyId: 'seed-1001', channel: 'form', name: null, phone: null, message: null, locale: 'te', userId: null,
    stage: 'new', assignedAgentId: null, notes: null, refId: null, createdAt: Timestamp.fromMillis(now - ageH * 3600_000), ...data,
  });
  await lead('seed-lead-1', { name: 'Ramesh', phone: '9876543210', message: 'ధర తగ్గుతుందా?' }, 2);
  await lead('seed-lead-2', { name: 'Lakshmi', phone: '9876500000', message: 'Site visit kavali', propertyId: 'seed-pending-2', refId: 'seed-dealer' }, 5);
  await lead('seed-lead-3', { name: 'Venkat', phone: '9876511111', stage: 'contacted', assignedAgentId: 'seed-agent' }, 30);
  // Phase 9: an owner who asked OnlineLand to sell (fee on success), a lead in negotiation, two service requests.
  await db.doc('properties/seed-1001').update({ saleMode: 'assisted', saleModeAt: Timestamp.fromMillis(now - 2 * DAY) });
  await lead('seed-lead-4', { name: 'Prasad', phone: '9876522222', stage: 'negotiation', message: '₹20 లక్షలకు ఒప్పుకుంటారా?' }, 50);
  const service = (id, data, ageH) => db.doc(`serviceRequests/${id}`).set({
    propertyId: null, name: 'Suresh', phone: '9000000202', note: null, locale: 'te', userId: 'seed-buyer',
    status: 'new', quotedInr: null, adminNote: null, createdAt: Timestamp.fromMillis(now - ageH * 3600_000), ...data,
  });
  await service('seed-svc-1', { serviceId: 'survey', note: 'Makthal, 3 ఎకరాలు' }, 3);
  await service('seed-svc-2', { serviceId: 'documents', propertyId: 'seed-1001', status: 'quoted', quotedInr: 2999 }, 26);
  await db.doc('paymentRequests/seed-pay-2').set({
    userId: 'seed-buyer', kind: 'service', planId: null, propertyId: null, serviceRequestId: 'seed-svc-2', amountInr: 2999,
    utr: '512345678902', status: 'pending', rejectReason: null, reviewedBy: null, reviewedAt: null, createdAt: Timestamp.fromMillis(now - 1800_000),
  });
  await db.doc('siteVisits/seed-visit-1').set({
    propertyId: 'seed-1001', leadId: 'seed-lead-1', name: 'Ramesh', phone: '9876543210', date: '2026-12-01', slot: 'morning',
    status: 'requested', userId: null, agentId: null, notes: null, createdAt: Timestamp.fromMillis(now - 3600_000),
  });
}

console.log(`✔ Seeded ${TELANGANA_DISTRICTS.length} districts, ${Object.values(MANDALS).flat().length} mandals, ${listings.length} test listings, ${seededUsers.length} test users (project ${PROJECT}).`);
