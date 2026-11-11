import type { AreaUnit, LocalizedText, PropertyCategory, PropertyPurpose } from '@onlineland/shared';

/**
 * SAMPLE DATA for the Phase 3 homepage design only.
 * These are not real listings and are shown with a "Sample" badge.
 * Replaced by approved Firestore listings in Phase 5.
 */
export interface SampleProperty {
  id: string;
  category: PropertyCategory;
  purpose: PropertyPurpose;
  title: LocalizedText;
  place: LocalizedText;
  area: number;
  areaUnit: AreaUnit;
  /** Rupees. With priceBasis "per-unit" this is per area unit; "per-month" for rentals. */
  price: number;
  priceBasis: 'total' | 'per-unit' | 'per-month';
}

export const SAMPLE_PROPERTIES: SampleProperty[] = [
  {
    id: 'sample-1',
    category: 'agricultural',
    purpose: 'sale',
    title: { te: 'బోర్‌వెల్ ఉన్న వ్యవసాయ భూమి', en: 'Farmland with borewell' },
    place: { te: 'మక్తల్ మండలం, నారాయణపేట', en: 'Makthal mandal, Narayanpet' },
    area: 5,
    areaUnit: 'acre',
    price: 1_400_000,
    priceBasis: 'per-unit',
  },
  {
    id: 'sample-2',
    category: 'open-plot',
    purpose: 'sale',
    title: { te: 'తూర్పు ముఖ ఓపెన్ ప్లాట్', en: 'East-facing open plot' },
    place: { te: 'మక్తల్ టౌన్, నారాయణపేట', en: 'Makthal town, Narayanpet' },
    area: 200,
    areaUnit: 'sq-yd',
    price: 1_600_000,
    priceBasis: 'total',
  },
  {
    id: 'sample-3',
    category: 'farmhouse',
    purpose: 'sale',
    title: { te: 'మామిడి తోటతో ఫామ్‌హౌస్', en: 'Farmhouse with mango orchard' },
    place: { te: 'షాద్‌నగర్, రంగారెడ్డి', en: 'Shadnagar, Rangareddy' },
    area: 1,
    areaUnit: 'acre',
    price: 12_000_000,
    priceBasis: 'total',
  },
  {
    id: 'sample-4',
    category: 'flat',
    purpose: 'sale',
    title: { te: '2BHK ఫ్లాట్, గేటెడ్ కమ్యూనిటీ', en: '2BHK flat in a gated community' },
    place: { te: 'కూకట్‌పల్లి, హైదరాబాద్', en: 'Kukatpally, Hyderabad' },
    area: 1150,
    areaUnit: 'sq-ft',
    price: 6_800_000,
    priceBasis: 'total',
  },
  {
    id: 'sample-5',
    category: 'villa',
    purpose: 'sale',
    title: { te: '4BHK విల్లా', en: '4BHK villa' },
    place: { te: 'తెల్లాపూర్, సంగారెడ్డి', en: 'Tellapur, Sangareddy' },
    area: 300,
    areaUnit: 'sq-yd',
    price: 24_000_000,
    priceBasis: 'total',
  },
  {
    id: 'sample-6',
    category: 'rental',
    purpose: 'rent',
    title: { te: '2BHK ఇండిపెండెంట్ ఇల్లు', en: '2BHK independent house' },
    place: { te: 'మహబూబ్‌నగర్ టౌన్', en: 'Mahabubnagar town' },
    area: 900,
    areaUnit: 'sq-ft',
    price: 9_000,
    priceBasis: 'per-month',
  },
];
