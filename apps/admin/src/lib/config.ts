'use client';

/** Live plans, prices and services (Firestore over the D7 / Phase 9 defaults). */
import { collection, doc } from 'firebase/firestore';
import {
  DEFAULT_PLANS, DEFAULT_PRICING, DEFAULT_SERVICES, PLAN_IDS, SERVICE_IDS,
  type PlanConfig, type PlanId, type PricingSettings, type ServiceConfig, type ServiceId,
} from '@onlineland/shared';
import { fb } from './firebase';
import { useLiveDoc, useLiveQuery } from './live';

export function useRevenueConfig() {
  const plansQ = useLiveQuery<Partial<PlanConfig>>(() => collection(fb().db, 'plans'), 'plans');
  const pricingQ = useLiveDoc<Partial<PricingSettings>>(() => doc(fb().db, 'settings', 'pricing'), 'pricing');
  const servicesQ = useLiveDoc<Partial<Record<ServiceId, Partial<ServiceConfig>>>>(() => doc(fb().db, 'settings', 'services'), 'services');
  const plans = Object.fromEntries(
    PLAN_IDS.map((id) => [id, { ...DEFAULT_PLANS[id], ...(plansQ.rows.find((r) => r.id === id)?.data ?? {}) }]),
  ) as Record<PlanId, PlanConfig>;
  const pricing: PricingSettings = { ...DEFAULT_PRICING, ...(pricingQ.data ?? {}) };
  const services = Object.fromEntries(
    SERVICE_IDS.map((id) => [id, { ...DEFAULT_SERVICES[id], ...(servicesQ.data?.[id] ?? {}) }]),
  ) as Record<ServiceId, ServiceConfig>;
  return {
    plans, pricing, services,
    loading: plansQ.loading || pricingQ.loading || servicesQ.loading,
    error: plansQ.error ?? pricingQ.error ?? servicesQ.error,
  };
}
