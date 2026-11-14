import { getDistrict, getMandal, type Locale, type PropertyLocation } from '@onlineland/shared';

/** "Makthal, Narayanpet" style label in the visitor's language. Free-text mandals/villages are shown as entered. */
export function placeLabel(loc: Pick<PropertyLocation, 'district' | 'mandal' | 'village'>, locale: Locale, withVillage = true): string {
  const district = getDistrict(loc.district)?.name[locale] ?? loc.district;
  const mandal = getMandal(loc.district, loc.mandal)?.name[locale] ?? loc.mandal;
  // Skip the village when it only repeats the mandal (e.g. "Makthal" in Makthal mandal).
  const known = getMandal(loc.district, loc.mandal);
  const same = (v: string) =>
    !!v && [loc.mandal, known?.name.en, known?.name.te].some((n) => n && n.toLowerCase() === v.trim().toLowerCase());
  const village = withVillage && !same(loc.village) ? loc.village : '';
  const parts = [village, mandal, district].filter((p, i, arr) => p && arr.indexOf(p) === i);
  return parts.join(', ');
}
