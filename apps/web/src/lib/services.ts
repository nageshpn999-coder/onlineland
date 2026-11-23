/**
 * Paid-service requests from the website (Phase 9). Login is optional, like enquiries;
 * security rules validate every field (firebase/firestore.rules → serviceRequests).
 * Loaded lazily so the Firebase SDK is downloaded only when a visitor sends one.
 */
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { Locale, ServiceId } from '@onlineland/shared';
import { firebaseClient } from './firebase/client';

export interface ServiceRequestInput {
  serviceId: ServiceId;
  propertyId: string | null;
  name: string;
  phone: string; // normalized 10-digit mobile
  note: string | null;
  locale: Locale;
}

export async function createServiceRequest(input: ServiceRequestInput): Promise<string> {
  const { db, auth } = firebaseClient();
  const ref = await addDoc(collection(db, 'serviceRequests'), {
    serviceId: input.serviceId,
    propertyId: input.propertyId,
    name: input.name.trim().slice(0, 80),
    phone: input.phone,
    note: input.note?.trim().slice(0, 500) || null,
    locale: input.locale,
    userId: auth.currentUser?.uid ?? null,
    status: 'new',
    quotedInr: null,
    adminNote: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
