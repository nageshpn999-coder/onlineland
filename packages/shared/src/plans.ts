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
  yearlyPriceInr: number; // pay once for a year (365 days); 0 = no yearly option
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
    yearlyPriceInr: 0,
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
    yearlyPriceInr: 4999,
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
    yearlyPriceInr: 14999,
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
  dealCommissionPct: number; // fee when OnlineLand sells an owner's property ("assisted" sale), Phase 9
  launchOfferActive: boolean; // new dealers may take a free plan once
  launchOfferPlan: 'basic' | 'pro';
  launchOfferDays: number;
  launchOfferDistricts: string[]; // district slugs; empty = everywhere
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

/** A plan is paid monthly (its durationDays) or yearly (365 days). */
export const BILLING_PERIODS = ['month', 'year'] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];
export const YEAR_DAYS = 365;

export function planPrice(plan: Pick<PlanConfig, 'priceInr' | 'yearlyPriceInr'>, billing: BillingPeriod): number {
  return billing === 'year' ? plan.yearlyPriceInr : plan.priceInr;
}

export function planDays(plan: Pick<PlanConfig, 'durationDays'>, billing: BillingPeriod): number {
  return billing === 'year' ? YEAR_DAYS : plan.durationDays;
}

/** Months a yearly plan gives free compared with paying monthly (rounded down; 0 if none). */
export function yearlySavingMonths(plan: Pick<PlanConfig, 'priceInr' | 'yearlyPriceInr'>): number {
  if (!plan.priceInr || !plan.yearlyPriceInr) return 0;
  return Math.max(0, Math.floor((plan.priceInr * 12 - plan.yearlyPriceInr) / plan.priceInr));
}

/** OnlineLand's fee on an assisted sale, in rupees. */
export function commissionInr(dealPriceInr: number, pct: number): number {
  if (!(dealPriceInr > 0) || !(pct > 0)) return 0;
  return Math.round((dealPriceInr * pct) / 100);
}

/** What a payment is for. */
export const PAYMENT_KINDS = ['plan', 'featured', 'listing', 'service'] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** UPI transaction reference (UTR / RRN): 12 digits. */
export const UTR_RE = /^\d{12}$/;

/** Amount the customer must pay, from the live config (a service is paid at the price admin quoted). */
export function paymentAmount(
  kind: PaymentKind,
  planId: PlanId | null,
  plans: Record<PlanId, PlanConfig>,
  pricing: PricingSettings,
  opts: { billing?: BillingPeriod; quotedInr?: number | null } = {},
): number {
  if (kind === 'plan') return planId ? planPrice(plans[planId], opts.billing ?? 'month') : 0;
  if (kind === 'featured') return pricing.featuredWeekInr;
  if (kind === 'service') return opts.quotedInr ?? 0;
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
