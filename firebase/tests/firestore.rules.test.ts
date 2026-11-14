import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { createTestEnv, newLead, newListing, newSiteVisit, storedListing } from './helpers';

let env: RulesTestEnvironment;

const visitor = () => env.unauthenticatedContext().firestore();
const as = (uid: string, role: string) => env.authenticatedContext(uid, { role }).firestore();

beforeAll(async () => {
  env = await createTestEnv();
});
afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'properties/p-approved'), storedListing('owner1', { status: 'approved', code: 'OL-1001' }));
    await setDoc(doc(db, 'properties/p-pending'), storedListing('owner1'));
    await setDoc(doc(db, 'properties/p-approved/media/m1'), { storagePath: 'properties/p-approved/a.jpg', order: 0, isCover: true, createdAt: Timestamp.now() });
    await setDoc(doc(db, 'properties/p-pending/media/m1'), { storagePath: 'properties/p-pending/a.jpg', order: 0, isCover: true, createdAt: Timestamp.now() });
    await setDoc(doc(db, 'properties/p-approved/private/contact'), { ownerName: 'Owner', ownerPhone: '9123456780', address: null, commissionTerms: null });
    await setDoc(doc(db, 'users/buyer1'), { name: 'Buyer', role: 'buyer', language: 'te', status: 'active', phone: null, email: null, createdAt: Timestamp.now() });
    await setDoc(doc(db, 'leads/lead1'), { ...newLead(), createdAt: Timestamp.now(), assignedAgentId: 'agent1' });
    await setDoc(doc(db, 'siteVisits/v1'), { ...newSiteVisit(), createdAt: Timestamp.now(), agentId: 'agent1' });
    await setDoc(doc(db, 'locations/narayanpet'), { name: { te: 'నారాయణపేట', en: 'Narayanpet' }, level: 'district', parentId: null });
    await setDoc(doc(db, 'subscriptions/s1'), { dealerId: 'dealer1', planId: 'basic', status: 'active' });
    await setDoc(doc(db, 'auditLogs/a1'), { actorId: 'admin1', action: 'test', target: 'x', before: null, after: null, at: Timestamp.now() });
  });
});

describe('properties: reading', () => {
  it('visitor can read an approved listing', () => assertSucceeds(getDoc(doc(visitor(), 'properties/p-approved'))));
  it('visitor cannot read a pending listing', () => assertFails(getDoc(doc(visitor(), 'properties/p-pending'))));
  it('visitor can list approved listings', () =>
    assertSucceeds(getDocs(query(collection(visitor(), 'properties'), where('status', '==', 'approved')))));
  it('visitor cannot list all listings', () => assertFails(getDocs(collection(visitor(), 'properties'))));
  it('owner can read their own pending listing', () => assertSucceeds(getDoc(doc(as('owner1', 'owner'), 'properties/p-pending'))));
  it('another owner cannot read it', () => assertFails(getDoc(doc(as('owner2', 'owner'), 'properties/p-pending'))));
  it('admin and agent can read pending listings', async () => {
    await assertSucceeds(getDoc(doc(as('admin1', 'admin'), 'properties/p-pending')));
    await assertSucceeds(getDoc(doc(as('agent1', 'agent'), 'properties/p-pending')));
  });
  it('visitor can read photos of an approved listing only', async () => {
    await assertSucceeds(getDoc(doc(visitor(), 'properties/p-approved/media/m1')));
    await assertFails(getDoc(doc(visitor(), 'properties/p-pending/media/m1')));
  });
});

describe('properties: creating', () => {
  it('owner creates a pending listing', () =>
    assertSucceeds(setDoc(doc(as('owner1', 'owner'), 'properties/new1'), newListing('owner1'))));
  it('dealer creates a listing with source "dealer"', () =>
    assertSucceeds(setDoc(doc(as('dealer1', 'dealer'), 'properties/new1'), newListing('dealer1', { source: 'dealer' }))));
  it('buyer cannot post (must become owner first)', () =>
    assertFails(setDoc(doc(as('buyer1', 'buyer'), 'properties/new1'), newListing('buyer1'))));
  it('visitor cannot post', () => assertFails(setDoc(doc(visitor(), 'properties/new1'), newListing('x'))));
  it('cannot publish directly as approved', () =>
    assertFails(setDoc(doc(as('owner1', 'owner'), 'properties/new1'), newListing('owner1', { status: 'approved' }))));
  it('cannot mark itself featured', () =>
    assertFails(setDoc(doc(as('owner1', 'owner'), 'properties/new1'), newListing('owner1', { isFeatured: true }))));
  it('cannot create a listing for someone else', () =>
    assertFails(setDoc(doc(as('owner1', 'owner'), 'properties/new1'), newListing('owner2'))));
  it('owner cannot claim dealer source', () =>
    assertFails(setDoc(doc(as('owner1', 'owner'), 'properties/new1'), newListing('owner1', { source: 'dealer' }))));
  it('cannot set a code or verified documents', async () => {
    await assertFails(setDoc(doc(as('owner1', 'owner'), 'properties/new1'), newListing('owner1', { code: 'OL-1' })));
    await assertFails(setDoc(doc(as('owner1', 'owner'), 'properties/new1'), newListing('owner1', { docsVerified: true })));
  });
  it('rejects invalid data', async () => {
    const db = as('owner1', 'owner');
    await assertFails(setDoc(doc(db, 'properties/n'), newListing('owner1', { price: -5 })));
    await assertFails(setDoc(doc(db, 'properties/n'), newListing('owner1', { category: 'castle' })));
    await assertFails(setDoc(doc(db, 'properties/n'), newListing('owner1', { title: { te: '', en: '' } })));
    await assertFails(setDoc(doc(db, 'properties/n'), newListing('owner1', { photoCount: 50 })));
    await assertFails(setDoc(doc(db, 'properties/n'), newListing('owner1', { extra: 'field' })));
  });
});

describe('properties: editing', () => {
  it('owner edits a pending listing', () =>
    assertSucceeds(updateDoc(doc(as('owner1', 'owner'), 'properties/p-pending'), { price: 1_500_000, updatedAt: serverTimestamp() })));
  it('owner cannot approve their own listing', () =>
    assertFails(updateDoc(doc(as('owner1', 'owner'), 'properties/p-pending'), { status: 'approved', updatedAt: serverTimestamp() })));
  it('editing an approved listing must send it back to review', async () => {
    const db = as('owner1', 'owner');
    await assertFails(updateDoc(doc(db, 'properties/p-approved'), { price: 1, updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(db, 'properties/p-approved'), { price: 1_300_000, status: 'pending', updatedAt: serverTimestamp() }));
  });
  it('owner marks an approved listing as sold', () =>
    assertSucceeds(updateDoc(doc(as('owner1', 'owner'), 'properties/p-approved'), { status: 'sold', updatedAt: serverTimestamp() })));
  it('owner cannot make it featured', () =>
    assertFails(updateDoc(doc(as('owner1', 'owner'), 'properties/p-pending'), { isFeatured: true, updatedAt: serverTimestamp() })));
  it('another user cannot edit it', () =>
    assertFails(updateDoc(doc(as('owner2', 'owner'), 'properties/p-pending'), { price: 1, status: 'pending', updatedAt: serverTimestamp() })));
  it('admin can edit anything', () =>
    assertSucceeds(updateDoc(doc(as('admin1', 'admin'), 'properties/p-pending'), { isFeatured: true })));
  it('owner deletes a pending listing but not an approved one', async () => {
    const db = as('owner1', 'owner');
    await assertSucceeds(deleteDoc(doc(db, 'properties/p-pending')));
    await assertFails(deleteDoc(doc(db, 'properties/p-approved')));
  });
});

describe("owner's private contact (D3)", () => {
  it('visitor, buyer, other owner and agent cannot read it', async () => {
    await assertFails(getDoc(doc(visitor(), 'properties/p-approved/private/contact')));
    await assertFails(getDoc(doc(as('buyer1', 'buyer'), 'properties/p-approved/private/contact')));
    await assertFails(getDoc(doc(as('owner2', 'owner'), 'properties/p-approved/private/contact')));
    await assertFails(getDoc(doc(as('agent1', 'agent'), 'properties/p-approved/private/contact')));
  });
  it('listing owner and admin can read it', async () => {
    await assertSucceeds(getDoc(doc(as('owner1', 'owner'), 'properties/p-approved/private/contact')));
    await assertSucceeds(getDoc(doc(as('admin1', 'admin'), 'properties/p-approved/private/contact')));
  });
  it('owner saves contact with a valid mobile number only', async () => {
    const db = as('owner1', 'owner');
    const base = { ownerName: 'Owner', address: null, commissionTerms: null };
    await assertSucceeds(setDoc(doc(db, 'properties/p-pending/private/contact'), { ...base, ownerPhone: '9123456780' }));
    await assertFails(setDoc(doc(db, 'properties/p-pending/private/contact'), { ...base, ownerPhone: '12345' }));
  });
});

describe('users', () => {
  it('user reads own profile; others cannot', async () => {
    await assertSucceeds(getDoc(doc(as('buyer1', 'buyer'), 'users/buyer1')));
    await assertFails(getDoc(doc(as('buyer2', 'buyer'), 'users/buyer1')));
    await assertFails(getDoc(doc(visitor(), 'users/buyer1')));
  });
  it('user changes name and language', () =>
    assertSucceeds(updateDoc(doc(as('buyer1', 'buyer'), 'users/buyer1'), { name: 'రవి', language: 'en', updatedAt: serverTimestamp() })));
  it('user cannot change their own role', () =>
    assertFails(updateDoc(doc(as('buyer1', 'buyer'), 'users/buyer1'), { role: 'admin', updatedAt: serverTimestamp() })));
  it('profile is created by the Cloud Function, not the client', () =>
    assertFails(setDoc(doc(as('new1', 'buyer'), 'users/new1'), { name: 'x', role: 'buyer' })));
  it('favorites are private to their owner', async () => {
    await assertSucceeds(setDoc(doc(as('buyer1', 'buyer'), 'users/buyer1/favorites/p-approved'), { savedAt: serverTimestamp() }));
    await assertSucceeds(getDoc(doc(as('buyer1', 'buyer'), 'users/buyer1/favorites/p-approved')));
    await assertFails(getDoc(doc(as('buyer2', 'buyer'), 'users/buyer1/favorites/p-approved')));
    await assertFails(setDoc(doc(as('buyer2', 'buyer'), 'users/buyer1/favorites/x'), { savedAt: serverTimestamp() }));
  });
});

describe('leads (enquiries)', () => {
  it('visitor sends an enquiry without login', () => assertSucceeds(setDoc(doc(visitor(), 'leads/n1'), newLead())));
  it('WhatsApp click without phone number is allowed', () =>
    assertSucceeds(setDoc(doc(visitor(), 'leads/n1'), newLead({ channel: 'whatsapp', phone: null, name: null, message: null }))));
  it('form enquiry needs a valid 10-digit mobile', async () => {
    await assertFails(setDoc(doc(visitor(), 'leads/n1'), newLead({ phone: null })));
    await assertFails(setDoc(doc(visitor(), 'leads/n2'), newLead({ phone: '1234567890' })));
  });
  it('cannot pre-assign an agent or set the stage', async () => {
    await assertFails(setDoc(doc(visitor(), 'leads/n1'), newLead({ assignedAgentId: 'agent1' })));
    await assertFails(setDoc(doc(visitor(), 'leads/n2'), newLead({ stage: 'won' })));
  });
  it('signed-in user must tag the enquiry with their own uid', async () => {
    await assertSucceeds(setDoc(doc(as('buyer1', 'buyer'), 'leads/n1'), newLead({ userId: 'buyer1' })));
    await assertFails(setDoc(doc(as('buyer1', 'buyer'), 'leads/n2'), newLead({ userId: 'someone' })));
  });
  it('visitors and other agents cannot read leads', async () => {
    await assertFails(getDoc(doc(visitor(), 'leads/lead1')));
    await assertFails(getDoc(doc(as('agent2', 'agent'), 'leads/lead1')));
    await assertFails(getDocs(collection(as('buyer1', 'buyer'), 'leads')));
  });
  it('assigned agent reads and updates the stage only', async () => {
    const db = as('agent1', 'agent');
    await assertSucceeds(getDoc(doc(db, 'leads/lead1')));
    await assertSucceeds(updateDoc(doc(db, 'leads/lead1'), { stage: 'contacted', notes: 'Called', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db, 'leads/lead1'), { assignedAgentId: 'agent2', updatedAt: serverTimestamp() }));
  });
  it('agent lists only their own leads', async () => {
    await assertSucceeds(getDocs(query(collection(as('agent1', 'agent'), 'leads'), where('assignedAgentId', '==', 'agent1'))));
    await assertFails(getDocs(collection(as('agent1', 'agent'), 'leads')));
  });
  it('admin reads all leads', () => assertSucceeds(getDocs(collection(as('admin1', 'admin'), 'leads'))));
});

describe('site visits', () => {
  it('visitor books a visit', () => assertSucceeds(setDoc(doc(visitor(), 'siteVisits/n1'), newSiteVisit())));
  it('booking needs a valid date, slot and mobile', async () => {
    await assertFails(setDoc(doc(visitor(), 'siteVisits/n1'), newSiteVisit({ date: 'tomorrow' })));
    await assertFails(setDoc(doc(visitor(), 'siteVisits/n2'), newSiteVisit({ slot: 'midnight' })));
    await assertFails(setDoc(doc(visitor(), 'siteVisits/n3'), newSiteVisit({ phone: '555' })));
    await assertFails(setDoc(doc(visitor(), 'siteVisits/n4'), newSiteVisit({ status: 'confirmed' })));
  });
  it('assigned agent confirms; others cannot read', async () => {
    await assertSucceeds(updateDoc(doc(as('agent1', 'agent'), 'siteVisits/v1'), { status: 'confirmed', updatedAt: serverTimestamp() }));
    await assertFails(getDoc(doc(as('agent2', 'agent'), 'siteVisits/v1')));
    await assertFails(getDoc(doc(visitor(), 'siteVisits/v1')));
  });
});

describe('reference data and function-only collections', () => {
  it('anyone reads locations; only admin writes', async () => {
    await assertSucceeds(getDoc(doc(visitor(), 'locations/narayanpet')));
    await assertFails(setDoc(doc(as('owner1', 'owner'), 'locations/x'), { name: { te: 'x', en: 'x' }, level: 'district', parentId: null }));
    await assertSucceeds(setDoc(doc(as('admin1', 'admin'), 'locations/x'), { name: { te: 'x', en: 'x' }, level: 'district', parentId: null }));
  });
  it('subscriptions: dealer reads own, nobody writes from a client', async () => {
    await assertSucceeds(getDoc(doc(as('dealer1', 'dealer'), 'subscriptions/s1')));
    await assertFails(getDoc(doc(as('dealer2', 'dealer'), 'subscriptions/s1')));
    await assertFails(setDoc(doc(as('admin1', 'admin'), 'subscriptions/s2'), { dealerId: 'x' }));
  });
  it('audit logs: admin reads, nobody writes from a client', async () => {
    await assertSucceeds(getDoc(doc(as('admin1', 'admin'), 'auditLogs/a1')));
    await assertFails(getDoc(doc(as('agent1', 'agent'), 'auditLogs/a1')));
    await assertFails(setDoc(doc(as('admin1', 'admin'), 'auditLogs/a2'), { action: 'fake' }));
  });
  it('counters and unknown collections are closed', async () => {
    await assertFails(getDoc(doc(as('admin1', 'admin'), 'counters/properties')));
    await assertFails(setDoc(doc(as('admin1', 'admin'), 'random/x'), { a: 1 }));
  });
});
