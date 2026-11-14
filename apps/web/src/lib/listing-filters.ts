/**
 * Search filters for /properties. Pure functions (no Firebase), unit-tested in listing-filters.test.ts.
 * Filtering runs on the server over the cached list of approved listings; when listings grow past
 * a few thousand this moves to a search service (Algolia/Typesense) without changing the URL format.
 */
import {
  MANDALS,
  PROPERTY_CATEGORIES,
  TELANGANA_DISTRICTS,
  inBudget,
  parseBudget,
  type PropertyCategory,
  type PropertyPurpose,
} from '@onlineland/shared';
import type { PublicProperty } from './property-types';

export const SORTS = ['newest', 'price-asc', 'price-desc'] as const;
export type Sort = (typeof SORTS)[number];
export const PAGE_SIZE = 12;

export interface ListingFilters {
  purpose: PropertyPurpose;
  type: PropertyCategory | null;
  district: string | null;
  mandal: string | null;
  budget: string | null;
  sort: Sort;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? '';
}

export function parseFilters(sp: RawParams): ListingFilters {
  const typeRaw = one(sp.type);
  const type = (PROPERTY_CATEGORIES.find((c) => c.id === typeRaw)?.id ?? null) as PropertyCategory | null;
  const purposeRaw = one(sp.purpose);
  const purpose: PropertyPurpose = purposeRaw === 'rent' || (!purposeRaw && type === 'rental') ? 'rent' : 'sale';
  const districtRaw = one(sp.district);
  const district = TELANGANA_DISTRICTS.some((d) => d.id === districtRaw) ? districtRaw : null;
  const mandalRaw = one(sp.mandal);
  const mandal = district && MANDALS[district]?.some((m) => m.id === mandalRaw) ? mandalRaw : null;
  const budgetRaw = one(sp.budget);
  const budget = parseBudget(budgetRaw) ? budgetRaw : null;
  const sortRaw = one(sp.sort);
  const sort: Sort = (SORTS as readonly string[]).includes(sortRaw) ? (sortRaw as Sort) : 'newest';
  const pageNum = Number.parseInt(one(sp.page), 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 && pageNum < 1000 ? pageNum : 1;
  return { purpose, type, district, mandal, budget, sort, page };
}

export function applyFilters(list: readonly PublicProperty[], f: ListingFilters): PublicProperty[] {
  const budget = parseBudget(f.budget);
  const out = list.filter(
    (p) =>
      p.purpose === f.purpose &&
      (!f.type || p.category === f.type) &&
      (!f.district || p.location.district === f.district) &&
      (!f.mandal || p.location.mandal === f.mandal) &&
      inBudget(p.total, budget),
  );
  if (f.sort === 'price-asc') out.sort((a, b) => a.total - b.total || b.createdAt - a.createdAt);
  else if (f.sort === 'price-desc') out.sort((a, b) => b.total - a.total || b.createdAt - a.createdAt);
  else out.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.createdAt - a.createdAt);
  return out;
}

export function paginate<T>(items: readonly T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pages);
  return { items: items.slice((current - 1) * size, current * size), page: current, pages, total: items.length };
}

/** Query string for a link, keeping current filters and applying overrides (null removes a key). */
export function filtersToQuery(f: ListingFilters, overrides: Partial<Record<keyof ListingFilters, string | number | null>> = {}) {
  const merged: Record<string, string | number | null> = {
    purpose: f.purpose,
    type: f.type,
    district: f.district,
    mandal: f.mandal,
    budget: f.budget,
    sort: f.sort === 'newest' ? null : f.sort,
    page: f.page > 1 ? f.page : null,
    ...overrides,
  };
  const q: Record<string, string> = {};
  for (const [k, v] of Object.entries(merged)) if (v !== null && v !== '') q[k] = String(v);
  return q;
}

export function activeFilterCount(f: ListingFilters): number {
  return [f.type, f.district, f.mandal, f.budget].filter(Boolean).length;
}
