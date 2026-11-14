import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

export const PROJECT_ID = 'demo-onlineland';
export const BUCKET = `gs://${PROJECT_ID}.appspot.com`;

const rulesPath = (file: string) => fileURLToPath(new URL(`../${file}`, import.meta.url));

export function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(rulesPath('firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync(rulesPath('storage.rules'), 'utf8'), host: '127.0.0.1', port: 9199 },
  });
}

/** A complete, valid listing as an owner's app would send it. */
export function newListing(ownerId: string, overrides: Record<string, unknown> = {}) {
  return {
    category: 'agricultural',
    purpose: 'sale',
    title: { te: 'బోర్‌వెల్ ఉన్న వ్యవసాయ భూమి', en: 'Farmland with borewell' },
    description: { te: '', en: '' },
    price: 1_400_000,
    priceBasis: 'per-unit',
    area: 5,
    areaUnit: 'acre',
    location: { district: 'narayanpet', mandal: 'makthal', village: 'Makthal', lat: null, lng: null },
    facing: null,
    roadAccess: true,
    waterSource: 'borewell',
    rera: null,
    coverPath: null,
    photoCount: 0,
    code: null,
    ownerId,
    source: 'owner',
    status: 'pending',
    isFeatured: false,
    featuredUntil: null,
    docsVerified: false,
    rejectReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

/** The same listing as stored in the database (for seeding with rules disabled). */
export function storedListing(ownerId: string, overrides: Record<string, unknown> = {}) {
  return newListing(ownerId, { createdAt: Timestamp.now(), updatedAt: Timestamp.now(), ...overrides });
}

export function newLead(overrides: Record<string, unknown> = {}) {
  return {
    propertyId: 'p-approved',
    channel: 'form',
    name: 'Ravi',
    phone: '9876543210',
    message: 'Is the price negotiable?',
    locale: 'te',
    userId: null,
    stage: 'new',
    assignedAgentId: null,
    notes: null,
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

export function newSiteVisit(overrides: Record<string, unknown> = {}) {
  return {
    propertyId: 'p-approved',
    leadId: null,
    name: 'Ravi',
    phone: '9876543210',
    date: '2026-12-01',
    slot: 'morning',
    status: 'requested',
    userId: null,
    agentId: null,
    notes: null,
    createdAt: serverTimestamp(),
    ...overrides,
  };
}
