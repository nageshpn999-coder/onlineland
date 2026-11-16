'use client';

/**
 * Dealer share links (decision D7): onlineland.in/te/properties/OL-1001?ref=<ownerId>
 *
 * - The ref counts only when it is the listing's own owner (Firestore rules check this too).
 * - Every enquiry from such a link is tagged with refId, so the CRM shows which dealer brought it.
 * - If that dealer's paid plan includes "own contact", visitors see the dealer's name and number
 *   instead of OnlineLand's. Otherwise everything still goes to OnlineLand.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface DealerContact {
  name: string;
  phone: string; // 10 digits
  verified: boolean;
}

interface DealerRef {
  refId: string | null;
  dealer: DealerContact | null;
}

const Ctx = createContext<DealerRef>({ refId: null, dealer: null });

export function DealerRefProvider({ ownerId, children }: { ownerId: string; children: ReactNode }) {
  const [state, setState] = useState<DealerRef>({ refId: null, dealer: null });

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref || !ownerId || ref !== ownerId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only known in the browser
    setState({ refId: ref, dealer: null });
    let cancelled = false;
    (async () => {
      const [{ doc, getDoc }, { firebaseClient }] = await Promise.all([import('firebase/firestore'), import('./firebase/client')]);
      const snap = await getDoc(doc(firebaseClient().db, 'dealers', ref));
      const d = snap.data();
      const until = d?.validUntil?.toMillis?.() ?? 0;
      if (!cancelled && d && d.ownContact === true && until > Date.now() && typeof d.phone === 'string' && /^[6-9]\d{9}$/.test(d.phone)) {
        setState({ refId: ref, dealer: { name: String(d.name || ''), phone: d.phone, verified: d.verified === true } });
      }
    })().catch((err) => console.warn('[dealer-ref]', err?.message));
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useDealerRef = () => useContext(Ctx);
