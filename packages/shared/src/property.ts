import type { LocalizedText } from './i18n';

/** Property categories, in display order. `slug` is used in URLs. */
export const PROPERTY_CATEGORIES = [
  { id: 'agricultural', slug: 'agricultural-land', label: { en: 'Agricultural Lands', te: 'వ్యవసాయ భూములు' } },
  { id: 'open-plot', slug: 'open-plots', label: { en: 'Open Plots', te: 'ఓపెన్ ప్లాట్లు' } },
  { id: 'flat', slug: 'flats', label: { en: 'Flats', te: 'ఫ్లాట్లు' } },
  { id: 'apartment', slug: 'apartments', label: { en: 'Apartments', te: 'అపార్ట్‌మెంట్లు' } },
  { id: 'villa', slug: 'villas', label: { en: 'Villas', te: 'విల్లాలు' } },
  { id: 'luxury-home', slug: 'luxury-homes', label: { en: 'Luxury Homes', te: 'లగ్జరీ ఇళ్లు' } },
  { id: 'commercial', slug: 'commercial', label: { en: 'Commercial Properties', te: 'వాణిజ్య ఆస్తులు' } },
  { id: 'farmhouse', slug: 'farmhouses', label: { en: 'Farmhouses', te: 'ఫామ్‌హౌస్‌లు' } },
  { id: 'rental', slug: 'rentals', label: { en: 'Rental Properties', te: 'అద్దె ఆస్తులు' } },
] as const satisfies readonly { id: string; slug: string; label: LocalizedText }[];

export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number]['id'];

export const PROPERTY_PURPOSES = ['sale', 'rent'] as const;
export type PropertyPurpose = (typeof PROPERTY_PURPOSES)[number];

/** Listing lifecycle: draft → pending → approved | rejected → sold | rented | expired. */
export const PROPERTY_STATUSES = ['draft', 'pending', 'approved', 'rejected', 'sold', 'rented', 'expired'] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

/** Who brought the listing: OnlineLand consultancy or the marketplace. */
export const PROPERTY_SOURCES = ['onlineland', 'owner', 'dealer'] as const;
export type PropertySource = (typeof PROPERTY_SOURCES)[number];

export const AREA_UNITS = [
  { id: 'acre', label: { en: 'Acres', te: 'ఎకరాలు' } },
  { id: 'gunta', label: { en: 'Guntas', te: 'గుంటలు' } },
  { id: 'sq-yd', label: { en: 'Sq. yards', te: 'చ. గజాలు' } },
  { id: 'sq-ft', label: { en: 'Sq. ft', te: 'చ. అడుగులు' } },
] as const satisfies readonly { id: string; label: LocalizedText }[];
export type AreaUnit = (typeof AREA_UNITS)[number]['id'];

/** 1 acre = 40 guntas = 4,840 sq. yards = 43,560 sq. ft. */
export const SQ_FT_PER_UNIT: Record<AreaUnit, number> = {
  acre: 43_560,
  gunta: 1_089,
  'sq-yd': 9,
  'sq-ft': 1,
};

/** Price is quoted either as a total or per area unit (e.g. ₹12 lakh per acre). */
export const PRICE_BASES = ['total', 'per-unit', 'per-month'] as const;
export type PriceBasis = (typeof PRICE_BASES)[number];

export function getCategory(id: string) {
  return PROPERTY_CATEGORIES.find((c) => c.id === id);
}
