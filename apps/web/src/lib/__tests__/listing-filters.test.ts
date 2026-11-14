import { describe, expect, it } from 'vitest';
import { inBudget, parseBudget, totalPrice } from '@onlineland/shared';
import { activeFilterCount, applyFilters, filtersToQuery, paginate, parseFilters } from '../listing-filters';
import { normalizeMobile, MOBILE_RE } from '../phone';
import type { PublicProperty } from '../property-types';

function prop(o: Partial<PublicProperty>): PublicProperty {
  return {
    id: 'x', code: 'OL-1', category: 'agricultural', purpose: 'sale',
    title: { te: 't', en: 't' }, description: { te: '', en: '' },
    price: 100, priceBasis: 'total', total: 100, area: 1, areaUnit: 'acre',
    location: { district: 'narayanpet', mandal: 'makthal', village: '', lat: null, lng: null },
    facing: null, roadAccess: null, waterSource: null, rera: null, coverPath: null, photoCount: 0,
    isFeatured: false, docsVerified: false, createdAt: 0, ...o,
  };
}

describe('pricing', () => {
  it('multiplies per-acre prices by area', () => {
    expect(totalPrice({ price: 1_400_000, priceBasis: 'per-unit', area: 5 })).toBe(7_000_000);
    expect(totalPrice({ price: 1_600_000, priceBasis: 'total', area: 200 })).toBe(1_600_000);
  });
  it('parses budget ranges', () => {
    expect(parseBudget('1000000-2500000')).toEqual({ min: 1_000_000, max: 2_500_000 });
    expect(parseBudget('10000000-')).toEqual({ min: 10_000_000, max: null });
    expect(parseBudget('abc')).toBeNull();
    expect(parseBudget('500-100')).toBeNull();
    expect(inBudget(1_800_000, parseBudget('1000000-2500000'))).toBe(true);
    expect(inBudget(3_000_000, parseBudget('1000000-2500000'))).toBe(false);
    expect(inBudget(5, null)).toBe(true);
  });
});

describe('parseFilters', () => {
  it('defaults to sale, newest, page 1', () => {
    expect(parseFilters({})).toEqual({ purpose: 'sale', type: null, district: null, mandal: null, budget: null, sort: 'newest', page: 1 });
  });
  it('drops unknown or unsafe values', () => {
    const f = parseFilters({ type: 'castle', district: 'mars', mandal: 'x', budget: '9-1', sort: 'random', page: '-4' });
    expect(f).toMatchObject({ type: null, district: null, mandal: null, budget: null, sort: 'newest', page: 1 });
  });
  it('accepts a mandal only inside its district', () => {
    expect(parseFilters({ district: 'narayanpet', mandal: 'makthal' }).mandal).toBe('makthal');
    expect(parseFilters({ district: 'hyderabad', mandal: 'makthal' }).mandal).toBeNull();
  });
  it('rental type implies rent when purpose is missing', () => {
    expect(parseFilters({ type: 'rental' }).purpose).toBe('rent');
  });
});

describe('applyFilters', () => {
  const list = [
    prop({ id: 'a', total: 7_000_000, createdAt: 3 }),
    prop({ id: 'b', total: 1_800_000, createdAt: 2, location: { district: 'narayanpet', mandal: 'utkoor', village: '', lat: null, lng: null } }),
    prop({ id: 'c', total: 1_600_000, createdAt: 1, category: 'open-plot' }),
    prop({ id: 'd', total: 9_000, purpose: 'rent', category: 'rental' }),
    prop({ id: 'e', total: 12_000_000, createdAt: 4, isFeatured: false, location: { district: 'rangareddy', mandal: '', village: '', lat: null, lng: null } }),
    prop({ id: 'f', total: 900_000, createdAt: 0, isFeatured: true }),
  ];
  const ids = (sp: Record<string, string>) => applyFilters(list, parseFilters(sp)).map((p) => p.id);

  it('filters by purpose, type, district, mandal and budget together', () => {
    expect(ids({})).toEqual(['f', 'e', 'a', 'b', 'c']);
    expect(ids({ purpose: 'rent' })).toEqual(['d']);
    expect(ids({ type: 'agricultural', district: 'narayanpet' })).toEqual(['f', 'a', 'b']);
    expect(ids({ district: 'narayanpet', mandal: 'utkoor' })).toEqual(['b']);
    expect(ids({ budget: '1000000-2500000' })).toEqual(['b', 'c']);
  });
  it('featured listings come first in "newest"; price sorts ignore featured', () => {
    expect(ids({ sort: 'price-asc' })).toEqual(['f', 'c', 'b', 'a', 'e']);
    expect(ids({ sort: 'price-desc' })).toEqual(['e', 'a', 'b', 'c', 'f']);
  });
});

describe('paginate and query helpers', () => {
  it('splits into pages of 12 and clamps the page', () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    expect(paginate(items, 1)).toMatchObject({ page: 1, pages: 3, total: 30 });
    expect(paginate(items, 3).items).toEqual([24, 25, 26, 27, 28, 29]);
    expect(paginate(items, 9).page).toBe(3);
    expect(paginate([], 1)).toMatchObject({ page: 1, pages: 1, total: 0 });
  });
  it('builds clean query strings', () => {
    const f = parseFilters({ type: 'agricultural', district: 'narayanpet', sort: 'price-asc' });
    expect(filtersToQuery(f, { page: 2 })).toEqual({ purpose: 'sale', type: 'agricultural', district: 'narayanpet', sort: 'price-asc', page: '2' });
    expect(activeFilterCount(f)).toBe(2);
  });
});

describe('mobile numbers', () => {
  it('normalizes common Indian formats', () => {
    expect(normalizeMobile('98765 43210')).toBe('9876543210');
    expect(normalizeMobile('+91 98765-43210')).toBe('9876543210');
    expect(normalizeMobile('09876543210')).toBe('9876543210');
    expect(MOBILE_RE.test('9876543210')).toBe(true);
    expect(MOBILE_RE.test('1234567890')).toBe(false);
    expect(MOBILE_RE.test('98765')).toBe(false);
  });
});
