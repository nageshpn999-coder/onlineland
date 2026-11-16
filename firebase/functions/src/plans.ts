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
    priceInr: 0, durationDays: 0, listingLimit: 2, featuredSlots: 0,
    ownContact: false, verifiedBadge: false, dealerPage: false, areaLeads: false, active: true,
  },
  basic: {
    name: { te: 'బేసిక్', en: 'Basic' },
    priceInr: 499, durationDays: 30, listingLimit: 15, featuredSlots: 0,
    ownContact: true, verifiedBadge: true, dealerPage: false, areaLeads: false, active: true,
  },
  pro: {
    name: { te: 'ప్రో', en: 'Pro' },
    priceInr: 1499, durationDays: 30, listingLimit: 0, featuredSlots: 2,
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

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === 'string' && (PLAN_IDS as readonly string[]).includes(v);
}
