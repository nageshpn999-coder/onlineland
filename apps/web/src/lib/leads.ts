/**
 * Browser-side enquiry writes. Security rules validate every field (see firebase/firestore.rules → leads, siteVisits).
 * Loaded lazily (dynamic import) so the Firebase SDK is downloaded only when a visitor acts.
 */
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { LeadChannel, Locale } from '@onlineland/shared';
import { firebaseClient } from './firebase/client';

export interface LeadInput {
  propertyId: string | null;
  channel: LeadChannel;
  locale: Locale;
  name?: string | null;
  phone?: string | null;
  message?: string | null;
}

export { MOBILE_RE, normalizeMobile } from './phone';

export async function createLead(input: LeadInput): Promise<string> {
  const { db, auth } = firebaseClient();
  const ref = await addDoc(collection(db, 'leads'), {
    propertyId: input.propertyId,
    channel: input.channel,
    name: input.name?.trim() || null,
    phone: input.phone ?? null,
    message: input.message?.trim() || null,
    locale: input.locale,
    userId: auth.currentUser?.uid ?? null,
    stage: 'new',
    assignedAgentId: null,
    notes: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export interface SiteVisitInput {
  propertyId: string;
  name: string;
  phone: string;
  date: string;
  slot: 'morning' | 'afternoon' | 'evening';
  locale: Locale;
}

/** Records the booking as a lead (so it reaches the CRM) and as a site visit linked to it. */
export async function createSiteVisit(input: SiteVisitInput): Promise<string> {
  const { db, auth } = firebaseClient();
  const leadId = await createLead({
    propertyId: input.propertyId,
    channel: 'site-visit',
    locale: input.locale,
    name: input.name,
    phone: input.phone,
    message: `${input.date} ${input.slot}`,
  });
  const ref = await addDoc(collection(db, 'siteVisits'), {
    propertyId: input.propertyId,
    leadId,
    name: input.name.trim(),
    phone: input.phone,
    date: input.date,
    slot: input.slot,
    status: 'requested',
    userId: auth.currentUser?.uid ?? null,
    agentId: null,
    notes: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
