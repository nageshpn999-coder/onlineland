import type { PriceBasis } from './property';

/**
 * Total price a buyer pays (sale) or monthly rent (rent).
 * Listings priced per unit (e.g. ₹14 lakh per acre) are multiplied by their area.
 */
export function totalPrice(p: { price: number; priceBasis: PriceBasis; area: number }): number {
  return p.priceBasis === 'per-unit' ? Math.round(p.price * p.area) : p.price;
}

/** Budget keys used in the URL, e.g. "1000000-2500000" or "10000000-" (open-ended). */
export function parseBudget(key: string | null | undefined): { min: number; max: number | null } | null {
  if (!key) return null;
  const m = /^(\d+)-(\d*)$/.exec(key);
  if (!m) return null;
  const min = Number(m[1]);
  const max = m[2] ? Number(m[2]) : null;
  if (max !== null && max <= min) return null;
  return { min, max };
}

export function inBudget(amount: number, budget: { min: number; max: number | null } | null): boolean {
  if (!budget) return true;
  return amount >= budget.min && (budget.max === null || amount <= budget.max);
}
