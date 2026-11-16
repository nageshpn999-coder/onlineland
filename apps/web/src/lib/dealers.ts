/**
 * Public dealer cards (dealers/{uid}, written only by Cloud Functions). Server-side, cached.
 */
import 'server-only';
import { unstable_cache } from 'next/cache';
import { firebaseAdmin } from './firebase/admin';
import { PROPERTIES_TAG } from './properties';

export interface DealerCard {
  id: string;
  name: string;
  verified: boolean;
  planActive: boolean;
  dealerPage: boolean; // Pro: public page onlineland.in/dealer/{id}
  phone: string | null; // only while the plan includes ownContact
}

const load = unstable_cache(
  async (id: string): Promise<DealerCard | null> => {
    const snap = await firebaseAdmin().db.doc(`dealers/${id}`).get();
    const d = snap.data();
    if (!d) return null;
    const until = typeof d.validUntil?.toMillis === 'function' ? d.validUntil.toMillis() : 0;
    const planActive = until > Date.now();
    return {
      id,
      name: String(d.name ?? ''),
      verified: d.verified === true,
      planActive,
      dealerPage: planActive && d.dealerPage === true,
      phone: planActive && d.ownContact === true && typeof d.phone === 'string' ? d.phone : null,
    };
  },
  ['dealer-card-v1'],
  { revalidate: 300, tags: [PROPERTIES_TAG] },
);

export async function getDealerCard(id: string): Promise<DealerCard | null> {
  if (!id || id.length > 128 || id.includes('/')) return null;
  try {
    return await load(id);
  } catch (err) {
    console.error('[dealers] could not load dealer:', (err as Error).message);
    return null;
  }
}
