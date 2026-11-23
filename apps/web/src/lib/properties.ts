/**
 * Server-side reads of approved listings (Firebase Admin SDK, which bypasses security rules —
 * so every query here filters status == "approved" itself and strips private fields).
 * Results are cached for 60 s and refreshed early via revalidateTag('properties') (see /api/revalidate).
 */
import 'server-only';
import { unstable_cache } from 'next/cache';
import { totalPrice, type LocalizedText } from '@onlineland/shared';
import { firebaseAdmin } from './firebase/admin';
import type { PropertyPhoto, PropertyVideo, PublicProperty } from './property-types';

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
    ownerId: typeof d.ownerId === 'string' ? d.ownerId : '',
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
  ['approved-properties-v2'],
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

const loadMedia = unstable_cache(
  async (propertyId: string): Promise<{ photos: PropertyPhoto[]; videos: PropertyVideo[] }> => {
    const { db } = firebaseAdmin();
    const snap = await db.collection(`properties/${propertyId}/media`).orderBy('order', 'asc').limit(25).get();
    const photos: PropertyPhoto[] = [];
    const videos: PropertyVideo[] = [];
    for (const d of snap.docs) {
      const m = d.data();
      const type = m.type ?? 'photo';
      if (type === 'photo' && typeof m.storagePath === 'string') photos.push({ path: m.storagePath, isCover: m.isCover === true });
      else if (type === 'video' && typeof m.storagePath === 'string')
        videos.push({ kind: 'file', path: m.storagePath, posterPath: typeof m.posterPath === 'string' ? m.posterPath : null, durationSec: Number(m.durationSec) || null });
      else if (type === 'youtube' && typeof m.youtubeId === 'string' && /^[A-Za-z0-9_-]{11}$/.test(m.youtubeId))
        videos.push({ kind: 'youtube', youtubeId: m.youtubeId });
    }
    return { photos: photos.slice(0, 20), videos: videos.slice(0, 2) };
  },
  ['property-media-v2'],
  { revalidate: 300, tags: [PROPERTIES_TAG] },
);

async function media(propertyId: string) {
  try {
    return await loadMedia(propertyId);
  } catch (err) {
    console.error('[properties] could not load media:', (err as Error).message);
    return { photos: [], videos: [] };
  }
}

export async function getPropertyPhotos(propertyId: string): Promise<PropertyPhoto[]> {
  return (await media(propertyId)).photos;
}

/** The listing's video: an uploaded MP4 (compressed on the phone) or a YouTube link. */
export async function getPropertyVideos(propertyId: string): Promise<PropertyVideo[]> {
  return (await media(propertyId)).videos;
}

/** Approved listings of one owner/dealer (dealer page). */
export async function getPropertiesByOwner(ownerId: string): Promise<PublicProperty[]> {
  const all = await getApprovedProperties();
  return all.filter((p) => p.ownerId === ownerId);
}
