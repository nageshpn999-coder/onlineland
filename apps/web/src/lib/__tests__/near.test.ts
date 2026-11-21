import { describe, expect, it } from 'vitest';
import { DISTRICT_CENTERS, MANDALS, MANDAL_CENTERS, TELANGANA_DISTRICTS, distanceKm, inTelanganaArea, listingPoint } from '@onlineland/shared';
import { applyFilters, filtersToQuery, parseFilters, parseNear } from '../listing-filters';
import type { PublicProperty } from '../property-types';

const MAKTHAL = { lat: 16.5021, lng: 77.5075 };

describe('geo data', () => {
  it('every district and every listed mandal has a centre inside Telangana', () => {
    for (const d of TELANGANA_DISTRICTS) {
      expect(DISTRICT_CENTERS[d.id], d.id).toBeDefined();
      expect(inTelanganaArea(DISTRICT_CENTERS[d.id]!), d.id).toBe(true);
    }
    for (const [district, mandals] of Object.entries(MANDALS)) {
      for (const m of mandals) {
        const c = MANDAL_CENTERS[district]?.[m.id];
        expect(c, `${district}/${m.id}`).toBeDefined();
        // A mandal HQ lies within 60 km of its district HQ.
        expect(distanceKm(c!, DISTRICT_CENTERS[district]!), m.id).toBeLessThan(60);
      }
    }
  });

  it('distances are right', () => {
    expect(distanceKm(MAKTHAL, MAKTHAL)).toBe(0);
    const toNarayanpet = distanceKm(MAKTHAL, MANDAL_CENTERS.narayanpet!.narayanpet!);
    expect(toNarayanpet).toBeGreaterThan(25);
    expect(toNarayanpet).toBeLessThan(30);
    expect(distanceKm(DISTRICT_CENTERS.hyderabad!, DISTRICT_CENTERS.warangal!)).toBeGreaterThan(130);
  });

  it('uses the listing GPS, else the mandal, else the district', () => {
    expect(listingPoint({ district: 'narayanpet', mandal: 'makthal', lat: 16.6, lng: 77.6 })).toMatchObject({ precision: 'exact', lat: 16.6 });
    expect(listingPoint({ district: 'narayanpet', mandal: 'makthal', lat: null, lng: null })).toMatchObject({ precision: 'mandal' });
    expect(listingPoint({ district: 'rangareddy', mandal: 'Shadnagar', lat: null, lng: null })).toMatchObject({ precision: 'district' });
    expect(listingPoint({ district: 'nowhere', mandal: 'x', lat: null, lng: null })).toBeNull();
  });
});

describe('near me filters', () => {
  it('reads ?near= rounded to ~1 km and refuses places outside Telangana', () => {
    expect(parseNear('16.50214,77.50753')).toEqual({ lat: 16.5, lng: 77.51 });
    expect(parseNear('28.61,77.21')).toBeNull(); // Delhi
    expect(parseNear('abc')).toBeNull();
    const f = parseFilters({ near: '16.5,77.51', radius: '10' });
    expect(f).toMatchObject({ near: { lat: 16.5, lng: 77.51 }, radius: 10, sort: 'nearest' });
    expect(parseFilters({ radius: '10' }).radius).toBeNull(); // radius needs near
    expect(parseFilters({ near: '16.5,77.51', radius: '7' }).radius).toBeNull(); // only 5/10/25/50
    expect(parseFilters({ sort: 'nearest' }).sort).toBe('newest');
    expect(filtersToQuery(f)).toEqual({ purpose: 'sale', near: '16.5,77.51', radius: '10' });
  });

  const listing = (id: string, mandal: string, lat: number | null = null, lng: number | null = null) =>
    ({
      id, ownerId: 'o', code: id, category: 'open-plot', purpose: 'sale', title: { te: id, en: id }, description: { te: '', en: '' },
      price: 100, priceBasis: 'total', total: 100, area: 1, areaUnit: 'acre',
      location: { district: 'narayanpet', mandal, village: '', lat, lng },
      facing: null, roadAccess: null, waterSource: null, rera: null, coverPath: null, photoCount: 0,
      isFeatured: false, docsVerified: false, createdAt: 1,
    }) as unknown as PublicProperty;

  it('sorts nearest first, adds distances and applies the radius', () => {
    const list = [listing('far', 'kosgi'), listing('gps', 'makthal', 16.51, 77.52), listing('np', 'narayanpet'), listing('mk', 'makthal')];
    const out = applyFilters(list, parseFilters({ near: '16.5,77.51' }));
    expect(out.map((p) => p.id)).toEqual(['mk', 'gps', 'np', 'far']);
    expect(out[1]!.distancePrecision).toBe('exact');
    expect(out[0]!.distancePrecision).toBe('mandal');
    expect(applyFilters(list, parseFilters({ near: '16.5,77.51', radius: '5' })).map((p) => p.id)).toEqual(['mk', 'gps']);
    // without near: no distances
    expect(applyFilters(list, parseFilters({}))[0]!.distanceKm).toBeUndefined();
  });
});
