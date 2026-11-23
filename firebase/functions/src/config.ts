/** Live revenue config: Firestore values (edited in admin) over the defaults in plans.ts. */
import { db } from './common';
import {
  DEFAULT_PLANS, DEFAULT_PRICING, DEFAULT_SERVICES, PLAN_IDS, SERVICE_IDS,
  type PlanConfig, type PlanId, type PricingSettings, type ServiceConfig, type ServiceId,
} from './plans';

/** Live config: Firestore values over the defaults. */
export async function loadConfig(): Promise<{ plans: Record<PlanId, PlanConfig>; pricing: PricingSettings }> {
  const [planSnaps, pricingSnap] = await Promise.all([
    db.getAll(...PLAN_IDS.map((id) => db.doc(`plans/${id}`))),
    db.doc('settings/pricing').get(),
  ]);
  const plans = { ...DEFAULT_PLANS };
  planSnaps.forEach((s, i) => {
    const id = PLAN_IDS[i]!;
    if (s.exists) plans[id] = { ...DEFAULT_PLANS[id], ...(s.data() as Partial<PlanConfig>) };
  });
  const pricing = { ...DEFAULT_PRICING, ...((pricingSnap.data() ?? {}) as Partial<PricingSettings>) };
  return { plans, pricing };
}

/** settings/services: { drone: {...}, ... } over the defaults. */
export async function loadServices(): Promise<Record<ServiceId, ServiceConfig>> {
  const data = ((await db.doc('settings/services').get()).data() ?? {}) as Partial<Record<ServiceId, Partial<ServiceConfig>>>;
  return Object.fromEntries(SERVICE_IDS.map((id) => [id, { ...DEFAULT_SERVICES[id], ...(data[id] ?? {}) }])) as Record<ServiceId, ServiceConfig>;
}
