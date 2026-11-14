/**
 * Server-side reads of approved listings (Firebase Admin SDK, which bypasses security rules —
 * so every query here filters status == "approved" itself and strips private fields).
 * Results are cached for 60 s and refreshed early via revalidateTag('properties') (see /api/revalidate).
 */
import 'server-only';
import { unstable_cache } from 'next/cache';
import { totalPrice, type LocalizedText } from '@onlineland/shared';
import { firebaseAdmin } from './firebase/admin';
import type { PropertyPhoto, PublicProperty } from './property-types';

export const PROPERTIES_TAG = 'properties';
const MAX_LISTINGS = 2000;

type Doc = FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot;

function localized(v: unknown): LocalizedText {
  const o = (v ?? {}) as Partial<LocalizedText>;
  return { te: typeof o.te === 'string' ? o.te : '', en: typeof o.en === 'string' ? o.en : '' };
}

function millis(v: unknown): number {
  return v && typeof (v as { toMillis?: unknown }).toMillis === 'function' ? (v as { toMillis(): number }).toMillis() : 0;
}

export function toPublicProperty(doc: Doc): PublicProperty | null {
  const d = doc.data();
  if (!d || d.status !== 'approved' || typeof d.code !== 'string') return null;
  const loc = (d.location ?? {}) as Record<string, unknown>;
  return {
    id: doc.id,
    code: d.code,
    category: d.category,
    purpose: d.purpose,
    title: localized(d.title),
    description: localized(d.description),
    price: Number(d.price) || 0,
    priceBasis: d.priceBasis,
    total: totalPrice({ price: Number(d.price) || 0, priceBasis: d.priceBasis, area: Number(d.area) || 0 }),
    area: Number(d.area) || 0,
    areaUnit: d.areaUnit,
    location: {
      district: String(loc.district ?? ''),
      mandal: String(loc.mandal ?? ''),
      village: String(loc.village ?? ''),
      lat: typeof loc.lat === 'number' ? loc.lat : null,
      lng: typeof loc.lng === 'number' ? loc.lng : null,
    },
    facing: d.facing ?? null,
    roadAccess: typeof d.roadAccess === 'boolean' ? d.roadAccess : null,
    waterSource: d.waterSource ?? null,
    rera: d.rera ?? null,
    coverPath: d.coverPath ?? null,
    photoCount: Number(d.photoCount) || 0,
    isFeatured: d.isFeatured === true && (!d.featuredUntil || millis(d.featuredUntil) > Date.now()),
    docsVerified: d.docsVerified === true,
    createdAt: millis(d.createdAt),
  };
}

const loadApproved = unstable_cache(
  async (): Promise<PublicProperty[]> => {
    const { db } = firebaseAdmin();
    const snap = await db
      .collection('properties')
      .where('status', '==', 'approved')
      .orderBy('createdAt', 'desc')
      .limit(MAX_LISTINGS)
      .get();
    return snap.docs.map(toPublicProperty).filter((p): p is PublicProperty => p !== null);
  },
  ['approved-properties-v1'],
  { revalidate: 60, tags: [PROPERTIES_TAG] },
);

/** All approved listings, newest first. Returns [] (and logs) if Firebase is unreachable, so pages still render. */
export async function getApprovedProperties(): Promise<PublicProperty[]> {
  try {
    return await loadApproved();
  } catch (err) {
    console.error('[properties] could not load listings:', (err as Error).message);
    return [];
  }
}

export async function getPropertyByCode(code: string): Promise<PublicProperty | null> {
  if (!/^OL-\d{1,8}$/.test(code)) return null;
  const all = await getApprovedProperties();
  return all.find((p) => p.code === code) ?? null;
}

/** Featured listings first, then the newest, for the homepage. */
export async function getHomepageProperties(limit = 6): Promise<PublicProperty[]> {
  const all = await getApprovedProperties();
  const featured = all.filter((p) => p.isFeatured);
  const rest = all.filter((p) => !p.isFeatured);
  return [...featured, ...rest].slice(0, limit);
}

const loadPhotos = unstable_cache(
  async (propertyId: string): Promise<PropertyPhoto[]> => {
    const { db } = firebaseAdmin();
    const snap = await db.collection(`properties/${propertyId}/media`).orderBy('order', 'asc').limit(20).get();
    return snap.docs
      .map((d) => d.data())
      .filter((m) => typeof m.storagePath === 'string')
      .map((m) => ({ path: m.storagePath as string, isCover: m.isCover === true }));
  },
  ['property-photos-v1'],
  { revalidate: 300, tags: [PROPERTIES_TAG] },
);

export async function getPropertyPhotos(propertyId: string): Promise<PropertyPhoto[]> {
  try {
    return await loadPhotos(propertyId);
  } catch (err) {
    console.error('[properties] could not load photos:', (err as Error).message);
    return [];
  }
}
