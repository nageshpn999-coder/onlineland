/**
 * Search filters for /properties. Pure functions (no Firebase), unit-tested in listing-filters.test.ts.
 * Filtering runs on the server over the cached list of approved listings; when listings grow past
 * a few thousand this moves to a search service (Algolia/Typesense) without changing the URL format.
 */
import {
  MANDALS,
  NEAR_RADII_KM,
  distanceKm,
  inTelanganaArea,
  listingPoint,
  roundCoord,
  type LatLng,
  type PointPrecision,
  PROPERTY_CATEGORIES,
  TELANGANA_DISTRICTS,
  inBudget,
  parseBudget,
  type PropertyCategory,
  type PropertyPurpose,
} from '@onlineland/shared';
import type { PublicProperty } from './property-types';

export const SORTS = ['newest', 'price-asc', 'price-desc', 'nearest'] as const;
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
  /** Visitor location (rounded to ~1 km) for "near me"; distances and nearest-first sort. */
  near: LatLng | null;
  radius: number | null; // km, one of NEAR_RADII_KM
}

/** A listing with its distance from the visitor, when "near me" is on. */
export type Listed = PublicProperty & { distanceKm?: number; distancePrecision?: PointPrecision };

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
  const near = parseNear(one(sp.near));
  const radiusNum = Number.parseInt(one(sp.radius), 10);
  const radius = near && (NEAR_RADII_KM as readonly number[]).includes(radiusNum) ? radiusNum : null;
  const sortRaw = one(sp.sort);
  let sort: Sort = (SORTS as readonly string[]).includes(sortRaw) ? (sortRaw as Sort) : near ? 'nearest' : 'newest';
  if (sort === 'nearest' && !near) sort = 'newest';
  const pageNum = Number.parseInt(one(sp.page), 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 && pageNum < 1000 ? pageNum : 1;
  return { purpose, type, district, mandal, budget, sort, page, near, radius };
}

/** "16.50,77.51" → point inside Telangana, rounded to ~1 km. */
export function parseNear(v: string): LatLng | null {
  const m = v.match(/^(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/);
  if (!m) return null;
  const p = { lat: roundCoord(Number(m[1])), lng: roundCoord(Number(m[2])) };
  return inTelanganaArea(p) ? p : null;
}

export function applyFilters(list: readonly PublicProperty[], f: ListingFilters): Listed[] {
  const budget = parseBudget(f.budget);
  let out: Listed[] = list.filter(
    (p) =>
      p.purpose === f.purpose &&
      (!f.type || p.category === f.type) &&
      (!f.district || p.location.district === f.district) &&
      (!f.mandal || p.location.mandal === f.mandal) &&
      inBudget(p.total, budget),
  );
  if (f.near) {
    const near = f.near;
    out = out.map((p) => {
      const pt = listingPoint(p.location);
      return pt ? { ...p, distanceKm: distanceKm(near, pt), distancePrecision: pt.precision } : p;
    });
    if (f.radius) out = out.filter((p) => p.distanceKm !== undefined && p.distanceKm <= f.radius!);
  }
  const far = Number.POSITIVE_INFINITY;
  if (f.sort === 'price-asc') out.sort((a, b) => a.total - b.total || b.createdAt - a.createdAt);
  else if (f.sort === 'price-desc') out.sort((a, b) => b.total - a.total || b.createdAt - a.createdAt);
  else if (f.sort === 'nearest') out.sort((a, b) => (a.distanceKm ?? far) - (b.distanceKm ?? far) || b.createdAt - a.createdAt);
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
  const defaultSort = f.near ? 'nearest' : 'newest';
  const merged: Record<string, string | number | null> = {
    purpose: f.purpose,
    type: f.type,
    district: f.district,
    mandal: f.mandal,
    budget: f.budget,
    sort: f.sort === defaultSort ? null : f.sort,
    page: f.page > 1 ? f.page : null,
    near: f.near ? `${f.near.lat},${f.near.lng}` : null,
    radius: f.radius,
    ...overrides,
  };
  const q: Record<string, string> = {};
  for (const [k, v] of Object.entries(merged)) if (v !== null && v !== '') q[k] = String(v);
  return q;
}

export function activeFilterCount(f: ListingFilters): number {
  return [f.type, f.district, f.mandal, f.budget, f.near].filter(Boolean).length;
}
