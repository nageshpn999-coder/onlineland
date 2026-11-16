'use client';

/** Live plans + prices (Firestore over the D7 defaults). */
import { collection, doc } from 'firebase/firestore';
import { DEFAULT_PLANS, DEFAULT_PRICING, PLAN_IDS, type PlanConfig, type PlanId, type PricingSettings } from '@onlineland/shared';
import { fb } from './firebase';
import { useLiveDoc, useLiveQuery } from './live';

export function useRevenueConfig() {
  const plansQ = useLiveQuery<Partial<PlanConfig>>(() => collection(fb().db, 'plans'), 'plans');
  const pricingQ = useLiveDoc<Partial<PricingSettings>>(() => doc(fb().db, 'settings', 'pricing'), 'pricing');
  const plans = Object.fromEntries(
    PLAN_IDS.map((id) => [id, { ...DEFAULT_PLANS[id], ...(plansQ.rows.find((r) => r.id === id)?.data ?? {}) }]),
  ) as Record<PlanId, PlanConfig>;
  const pricing: PricingSettings = { ...DEFAULT_PRICING, ...(pricingQ.data ?? {}) };
  return { plans, pricing, loading: plansQ.loading || pricingQ.loading, error: plansQ.error ?? pricingQ.error };
}
