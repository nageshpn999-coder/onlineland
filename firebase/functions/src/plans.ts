/**
 * Revenue defaults (decision D7). Same values as packages/shared/src/plans.ts — this package is
 * deployed on its own, so it keeps a copy; firebase/tests checks that both match.
 * Live values come from plans/{id} and settings/pricing (edited in the admin dashboard).
 */
export const PLAN_IDS = ['free', 'basic', 'pro'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface PlanConfig {
  name: { te: string; en: string };
  priceInr: number;
  durationDays: number;
  yearlyPriceInr: number; // 0 = no yearly option
  listingLimit: number; // 0 = unlimited
  featuredSlots: number;
  ownContact: boolean;
  verifiedBadge: boolean;
  dealerPage: boolean;
  areaLeads: boolean;
  active: boolean;
}

export const DEFAULT_PLANS: Record<PlanId, PlanConfig> = {
  free: {
    name: { te: 'ఉచితం', en: 'Free' },
    priceInr: 0, durationDays: 0, yearlyPriceInr: 0, listingLimit: 2, featuredSlots: 0,
    ownContact: false, verifiedBadge: false, dealerPage: false, areaLeads: false, active: true,
  },
  basic: {
    name: { te: 'బేసిక్', en: 'Basic' },
    priceInr: 499, durationDays: 30, yearlyPriceInr: 4999, listingLimit: 15, featuredSlots: 0,
    ownContact: true, verifiedBadge: true, dealerPage: false, areaLeads: false, active: true,
  },
  pro: {
    name: { te: 'ప్రో', en: 'Pro' },
    priceInr: 1499, durationDays: 30, yearlyPriceInr: 14999, listingLimit: 0, featuredSlots: 2,
    ownContact: true, verifiedBadge: true, dealerPage: true, areaLeads: true, active: true,
  },
};

export interface PricingSettings {
  featuredWeekInr: number;
  featuredDays: number;
  ownerFreeListings: number;
  ownerListingInr: number;
  ownerListingDays: number;
  renewalReminderDays: number;
  upiId: string;
  upiName: string;
  dealCommissionPct: number;
  launchOfferActive: boolean;
  launchOfferPlan: 'basic' | 'pro';
  launchOfferDays: number;
  launchOfferDistricts: string[];
}

export const DEFAULT_PRICING: PricingSettings = {
  featuredWeekInr: 199,
  featuredDays: 7,
  ownerFreeListings: 1,
  ownerListingInr: 199,
  ownerListingDays: 90,
  renewalReminderDays: 3,
  upiId: '',
  upiName: 'OnlineLand Infra Private Limited',
  dealCommissionPct: 1,
  launchOfferActive: false,
  launchOfferPlan: 'basic',
  launchOfferDays: 90,
  launchOfferDistricts: ['narayanpet'],
};

export const YEAR_DAYS = 365;

// ---------- Paid services (Phase 9) — same as packages/shared/src/services.ts ----------
export const SERVICE_IDS = ['drone', 'documents', 'survey', 'registration', 'loan'] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export interface ServiceConfig {
  name: { te: string; en: string };
  desc: { te: string; en: string };
  priceInr: number | null; // null = quoted later; 0 = free
  active: boolean;
}

export const DEFAULT_SERVICES: Record<ServiceId, ServiceConfig> = {
  drone: {
    name: { te: 'డ్రోన్ / వీడియో షూట్', en: 'Drone / video shoot' },
    desc: { te: 'మీ భూమిని పై నుంచి వీడియో తీసి listing లో పెడతాం. త్వరగా అమ్ముడవుతుంది.', en: 'We film your land from above and add it to the listing. It sells faster.' },
    priceInr: 1999, active: true,
  },
  documents: {
    name: { te: 'డాక్యుమెంట్స్ చెక్', en: 'Document check' },
    desc: { te: 'కొనే ముందు పట్టా, EC, లింక్ డాక్యుమెంట్స్ న్యాయవాది చేత చెక్ చేయిస్తాం.', en: 'A lawyer checks the title, EC and link documents before you buy.' },
    priceInr: 2999, active: true,
  },
  survey: {
    name: { te: 'సర్వే & హద్దులు', en: 'Survey & boundaries' },
    desc: { te: 'లైసెన్స్ ఉన్న సర్వేయర్ తో కొలత, హద్దు రాళ్ళు. ధర భూమిని బట్టి చెబుతాం.', en: 'Measurement and boundary stones by a licensed surveyor. Priced per land.' },
    priceInr: null, active: true,
  },
  registration: {
    name: { te: 'రిజిస్ట్రేషన్ సహాయం', en: 'Registration help' },
    desc: { te: 'సేల్ డీడ్, స్టాంప్ డ్యూటీ, సబ్-రిజిస్ట్రార్ ఆఫీసు పని అంతా చూసుకుంటాం.', en: 'Sale deed, stamp duty and the sub-registrar office, handled for you.' },
    priceInr: null, active: true,
  },
  loan: {
    name: { te: 'హోమ్ / ల్యాండ్ లోన్', en: 'Home / land loan' },
    desc: { te: 'బ్యాంకు లోన్ కి సహాయం. మీకు ఫీజు లేదు.', en: 'Help with a bank loan. No fee for you.' },
    priceInr: 0, active: true,
  },
};

export function isServiceId(v: unknown): v is ServiceId {
  return typeof v === 'string' && (SERVICE_IDS as readonly string[]).includes(v);
}

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === 'string' && (PLAN_IDS as readonly string[]).includes(v);
}
