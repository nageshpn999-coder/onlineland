/**
 * "Near me": distances from the visitor to each listing.
 *
 * A listing's own GPS point (saved when the owner tapped "use my location") is used when present.
 * Otherwise its mandal headquarters, otherwise its district headquarters — so every listing gets a
 * distance. Points are headquarters towns, accurate to a few km; the ones marked ≈ are estimates
 * (±5 km) and can be corrected here at any time. Mirrored in apps/android/lib/data/geo.dart (tested).
 */
import type { PropertyLocation } from './models';

export interface LatLng {
  lat: number;
  lng: number;
}

/** District headquarters. */
export const DISTRICT_CENTERS: Record<string, LatLng> = {
  adilabad: { lat: 19.6641, lng: 78.532 },
  'bhadradri-kothagudem': { lat: 17.55, lng: 80.619 },
  hanumakonda: { lat: 18.011, lng: 79.558 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  jagtial: { lat: 18.795, lng: 78.913 },
  jangaon: { lat: 17.724, lng: 79.152 },
  'jayashankar-bhupalpally': { lat: 18.438, lng: 79.869 },
  'jogulamba-gadwal': { lat: 16.235, lng: 77.799 },
  kamareddy: { lat: 18.32, lng: 78.338 },
  karimnagar: { lat: 18.4386, lng: 79.1288 },
  khammam: { lat: 17.2473, lng: 80.1514 },
  'kumuram-bheem-asifabad': { lat: 19.365, lng: 79.284 },
  mahabubabad: { lat: 17.6, lng: 80.002 },
  mahabubnagar: { lat: 16.7488, lng: 78.0035 },
  mancherial: { lat: 18.871, lng: 79.444 },
  medak: { lat: 18.045, lng: 78.26 },
  'medchal-malkajgiri': { lat: 17.629, lng: 78.481 },
  mulugu: { lat: 18.19, lng: 79.94 },
  nagarkurnool: { lat: 16.482, lng: 78.31 },
  nalgonda: { lat: 17.05, lng: 79.267 },
  narayanpet: { lat: 16.7457, lng: 77.4954 },
  nirmal: { lat: 19.096, lng: 78.344 },
  nizamabad: { lat: 18.6725, lng: 78.0941 },
  peddapalli: { lat: 18.614, lng: 79.374 },
  'rajanna-sircilla': { lat: 18.388, lng: 78.81 },
  rangareddy: { lat: 17.2, lng: 78.6 },
  sangareddy: { lat: 17.6248, lng: 78.0866 },
  siddipet: { lat: 18.1018, lng: 78.852 },
  suryapet: { lat: 17.14, lng: 79.62 },
  vikarabad: { lat: 17.338, lng: 77.904 },
  wanaparthy: { lat: 16.362, lng: 78.062 },
  warangal: { lat: 17.9689, lng: 79.5941 },
  'yadadri-bhuvanagiri': { lat: 17.511, lng: 78.889 },
};

/** Mandal headquarters (only districts whose mandals are listed in locations.ts). */
export const MANDAL_CENTERS: Record<string, Record<string, LatLng>> = {
  narayanpet: {
    damaragidda: { lat: 16.8189, lng: 77.5031 },
    dhanwada: { lat: 16.65, lng: 77.6667 },
    gundumal: { lat: 16.93, lng: 77.66 }, // ≈ between Kosgi and Maddur
    kosgi: { lat: 16.9878, lng: 77.7169 },
    kothapally: { lat: 16.87, lng: 77.68 }, // ≈ near Maddur
    krishna: { lat: 16.4093, lng: 77.3286 }, // Krishna railway station
    maddur: { lat: 16.8602, lng: 77.6121 },
    maganoor: { lat: 16.455, lng: 77.43 }, // ≈ between Makthal and Krishna
    makthal: { lat: 16.5021, lng: 77.5075 },
    marikal: { lat: 16.6036, lng: 77.7282 },
    narayanpet: { lat: 16.7445, lng: 77.496 },
    narva: { lat: 16.48, lng: 77.68 }, // ≈
    utkoor: { lat: 16.6427, lng: 77.4874 },
  },
};

export const NEAR_RADII_KM = [5, 10, 25, 50] as const;

/** Great-circle distance in km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type PointPrecision = 'exact' | 'mandal' | 'district';

/** Where a listing is, as precisely as we know. */
export function listingPoint(loc: Pick<PropertyLocation, 'district' | 'mandal' | 'lat' | 'lng'>): (LatLng & { precision: PointPrecision }) | null {
  if (typeof loc.lat === 'number' && typeof loc.lng === 'number' && Math.abs(loc.lat) <= 90 && Math.abs(loc.lng) <= 180) {
    return { lat: loc.lat, lng: loc.lng, precision: 'exact' };
  }
  const m = MANDAL_CENTERS[loc.district]?.[loc.mandal];
  if (m) return { ...m, precision: 'mandal' };
  const d = DISTRICT_CENTERS[loc.district];
  return d ? { ...d, precision: 'district' } : null;
}

/** Inside Telangana's bounding box (with a margin) — rejects nonsense "near" values. */
export function inTelanganaArea(p: LatLng): boolean {
  return p.lat >= 15.3 && p.lat <= 20.2 && p.lng >= 76.8 && p.lng <= 81.6;
}

/** Visitor location rounded to ~1 km before it goes into a URL (privacy). */
export const roundCoord = (v: number) => Math.round(v * 100) / 100;
