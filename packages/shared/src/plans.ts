/**
 * Revenue model (decision D7, 17 Nov 2026). These are the defaults; the live values are
 * plans/{id} and settings/pricing in Firestore, editable from the admin dashboard.
 * firebase/functions keeps its own copy (deployed separately); a test checks both match.
 */
import type { LocalizedText } from './i18n';

export const PLAN_IDS = ['free', 'basic', 'pro'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface PlanConfig {
  name: LocalizedText;
  priceInr: number; // per period
  durationDays: number;
  listingLimit: number; // active (approved) listings at one time; 0 = unlimited
  featuredSlots: number; // featured listings included per period
  ownContact: boolean; // shared links show the dealer's own name + number
  verifiedBadge: boolean; // eligible for the ✓ badge (admin still verifies)
  dealerPage: boolean; // public page onlineland.in/dealer/{id}
  areaLeads: boolean; // admin may forward OnlineLand leads in the dealer's area
  active: boolean;
}

export const DEFAULT_PLANS: Record<PlanId, PlanConfig> = {
  free: {
    name: { te: 'ఉచితం', en: 'Free' },
    priceInr: 0,
    durationDays: 0,
    listingLimit: 2,
    featuredSlots: 0,
    ownContact: false,
    verifiedBadge: false,
    dealerPage: false,
    areaLeads: false,
    active: true,
  },
  basic: {
    name: { te: 'బేసిక్', en: 'Basic' },
    priceInr: 499,
    durationDays: 30,
    listingLimit: 15,
    featuredSlots: 0,
    ownContact: true,
    verifiedBadge: true,
    dealerPage: false,
    areaLeads: false,
    active: true,
  },
  pro: {
    name: { te: 'ప్రో', en: 'Pro' },
    priceInr: 1499,
    durationDays: 30,
    listingLimit: 0,
    featuredSlots: 2,
    ownContact: true,
    verifiedBadge: true,
    dealerPage: true,
    areaLeads: true,
    active: true,
  },
};

/** settings/pricing */
export interface PricingSettings {
  featuredWeekInr: number; // one listing on top for 7 days
  featuredDays: number;
  ownerFreeListings: number; // an owner's first N listings are free
  ownerListingInr: number; // each further owner listing
  ownerListingDays: number; // a paid owner listing stays live this long (or until sold)
  renewalReminderDays: number;
  upiId: string; // shown to customers; not a secret
  upiName: string;
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
};

/** What a payment is for. */
export const PAYMENT_KINDS = ['plan', 'featured', 'listing'] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** UPI transaction reference (UTR / RRN): 12 digits. */
export const UTR_RE = /^\d{12}$/;

/** Amount the customer must pay, from the live config. */
export function paymentAmount(
  kind: PaymentKind,
  planId: PlanId | null,
  plans: Record<PlanId, PlanConfig>,
  pricing: PricingSettings,
): number {
  if (kind === 'plan') return planId ? plans[planId].priceInr : 0;
  if (kind === 'featured') return pricing.featuredWeekInr;
  return pricing.ownerListingInr;
}

/** upi://pay link — opens GPay / PhonePe / Paytm with the amount filled in. */
export function upiLink(pricing: Pick<PricingSettings, 'upiId' | 'upiName'>, amountInr: number, note: string): string {
  const q: [string, string][] = [
    ['pa', pricing.upiId],
    ['pn', pricing.upiName],
    ['am', amountInr.toFixed(2)],
    ['cu', 'INR'],
    ['tn', note],
  ];
  return `upi://pay?${q.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
}

/** True while a paid plan is running. */
export function planActive(validUntilMs: number | null | undefined, nowMs: number): boolean {
  return typeof validUntilMs === 'number' && validUntilMs > nowMs;
}
