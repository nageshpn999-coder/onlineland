/**
 * Paid services (Phase 9): OnlineLand earns even when no sale happens.
 * Defaults here; live values are settings/services in Firestore (edited in admin).
 * firebase/functions keeps a copy (deployed on its own); a test checks both match.
 */
import type { LocalizedText } from './i18n';
import type { Locale } from './i18n';

export const SERVICE_IDS = ['drone', 'documents', 'survey', 'registration', 'loan'] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export interface ServiceConfig {
  name: LocalizedText;
  desc: LocalizedText;
  /** Fixed price in rupees; null = we quote after looking at the property; 0 = free for the customer. */
  priceInr: number | null;
  active: boolean;
}

export const DEFAULT_SERVICES: Record<ServiceId, ServiceConfig> = {
  drone: {
    name: { te: 'డ్రోన్ / వీడియో షూట్', en: 'Drone / video shoot' },
    desc: { te: 'మీ భూమిని పై నుంచి వీడియో తీసి listing లో పెడతాం. త్వరగా అమ్ముడవుతుంది.', en: 'We film your land from above and add it to the listing. It sells faster.' },
    priceInr: 1999,
    active: true,
  },
  documents: {
    name: { te: 'డాక్యుమెంట్స్ చెక్', en: 'Document check' },
    desc: { te: 'కొనే ముందు పట్టా, EC, లింక్ డాక్యుమెంట్స్ న్యాయవాది చేత చెక్ చేయిస్తాం.', en: 'A lawyer checks the title, EC and link documents before you buy.' },
    priceInr: 2999,
    active: true,
  },
  survey: {
    name: { te: 'సర్వే & హద్దులు', en: 'Survey & boundaries' },
    desc: { te: 'లైసెన్స్ ఉన్న సర్వేయర్ తో కొలత, హద్దు రాళ్ళు. ధర భూమిని బట్టి చెబుతాం.', en: 'Measurement and boundary stones by a licensed surveyor. Priced per land.' },
    priceInr: null,
    active: true,
  },
  registration: {
    name: { te: 'రిజిస్ట్రేషన్ సహాయం', en: 'Registration help' },
    desc: { te: 'సేల్ డీడ్, స్టాంప్ డ్యూటీ, సబ్-రిజిస్ట్రార్ ఆఫీసు పని అంతా చూసుకుంటాం.', en: 'Sale deed, stamp duty and the sub-registrar office, handled for you.' },
    priceInr: null,
    active: true,
  },
  loan: {
    name: { te: 'హోమ్ / ల్యాండ్ లోన్', en: 'Home / land loan' },
    desc: { te: 'బ్యాంకు లోన్ కి సహాయం. మీకు ఫీజు లేదు.', en: 'Help with a bank loan. No fee for you.' },
    priceInr: 0,
    active: true,
  },
};

export const SERVICE_STATUSES = ['new', 'quoted', 'paid', 'in-progress', 'done', 'cancelled'] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export function isServiceId(v: unknown): v is ServiceId {
  return typeof v === 'string' && (SERVICE_IDS as readonly string[]).includes(v);
}

/** serviceRequests/{id} — sent from the app or website (login optional, like enquiries). */
export interface ServiceRequest<T = unknown> {
  serviceId: ServiceId;
  propertyId: string | null;
  name: string;
  phone: string; // 10-digit Indian mobile
  note: string | null;
  locale: Locale;
  userId: string | null;
  status: ServiceStatus;
  quotedInr: number | null; // set by admin, or automatically for fixed prices
  adminNote: string | null;
  createdAt: T;
  updatedAt?: T;
}

/** How an owner wants to sell (asked once in the listing form, owners only). */
export const SALE_MODES = ['self', 'assisted'] as const;
export type SaleMode = (typeof SALE_MODES)[number];

/** Commission on a won lead (admin only). */
export const COMMISSION_STATUSES = ['pending', 'received'] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];
