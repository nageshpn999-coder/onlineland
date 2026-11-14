import type { LocalizedText } from './i18n';

/**
 * Telangana districts (33) and mandals where OnlineLand works most.
 * Used for search filters and seeded into the Firestore `locations` collection.
 * Ids are stable slugs stored on listings as location.district / location.mandal.
 */
export interface DistrictInfo {
  id: string;
  name: LocalizedText;
}

export const TELANGANA_DISTRICTS: readonly DistrictInfo[] = [
  { id: 'adilabad', name: { en: 'Adilabad', te: 'ఆదిలాబాద్' } },
  { id: 'bhadradri-kothagudem', name: { en: 'Bhadradri Kothagudem', te: 'భద్రాద్రి కొత్తగూడెం' } },
  { id: 'hanumakonda', name: { en: 'Hanumakonda', te: 'హనుమకొండ' } },
  { id: 'hyderabad', name: { en: 'Hyderabad', te: 'హైదరాబాద్' } },
  { id: 'jagtial', name: { en: 'Jagtial', te: 'జగిత్యాల' } },
  { id: 'jangaon', name: { en: 'Jangaon', te: 'జనగామ' } },
  { id: 'jayashankar-bhupalpally', name: { en: 'Jayashankar Bhupalpally', te: 'జయశంకర్ భూపాలపల్లి' } },
  { id: 'jogulamba-gadwal', name: { en: 'Jogulamba Gadwal', te: 'జోగులాంబ గద్వాల' } },
  { id: 'kamareddy', name: { en: 'Kamareddy', te: 'కామారెడ్డి' } },
  { id: 'karimnagar', name: { en: 'Karimnagar', te: 'కరీంనగర్' } },
  { id: 'khammam', name: { en: 'Khammam', te: 'ఖమ్మం' } },
  { id: 'kumuram-bheem-asifabad', name: { en: 'Kumuram Bheem Asifabad', te: 'కుమురం భీం ఆసిఫాబాద్' } },
  { id: 'mahabubabad', name: { en: 'Mahabubabad', te: 'మహబూబాబాద్' } },
  { id: 'mahabubnagar', name: { en: 'Mahabubnagar', te: 'మహబూబ్‌నగర్' } },
  { id: 'mancherial', name: { en: 'Mancherial', te: 'మంచిర్యాల' } },
  { id: 'medak', name: { en: 'Medak', te: 'మెదక్' } },
  { id: 'medchal-malkajgiri', name: { en: 'Medchal-Malkajgiri', te: 'మేడ్చల్-మల్కాజిగిరి' } },
  { id: 'mulugu', name: { en: 'Mulugu', te: 'ములుగు' } },
  { id: 'nagarkurnool', name: { en: 'Nagarkurnool', te: 'నాగర్‌కర్నూల్' } },
  { id: 'nalgonda', name: { en: 'Nalgonda', te: 'నల్గొండ' } },
  { id: 'narayanpet', name: { en: 'Narayanpet', te: 'నారాయణపేట' } },
  { id: 'nirmal', name: { en: 'Nirmal', te: 'నిర్మల్' } },
  { id: 'nizamabad', name: { en: 'Nizamabad', te: 'నిజామాబాద్' } },
  { id: 'peddapalli', name: { en: 'Peddapalli', te: 'పెద్దపల్లి' } },
  { id: 'rajanna-sircilla', name: { en: 'Rajanna Sircilla', te: 'రాజన్న సిరిసిల్ల' } },
  { id: 'rangareddy', name: { en: 'Rangareddy', te: 'రంగారెడ్డి' } },
  { id: 'sangareddy', name: { en: 'Sangareddy', te: 'సంగారెడ్డి' } },
  { id: 'siddipet', name: { en: 'Siddipet', te: 'సిద్దిపేట' } },
  { id: 'suryapet', name: { en: 'Suryapet', te: 'సూర్యాపేట' } },
  { id: 'vikarabad', name: { en: 'Vikarabad', te: 'వికారాబాద్' } },
  { id: 'wanaparthy', name: { en: 'Wanaparthy', te: 'వనపర్తి' } },
  { id: 'warangal', name: { en: 'Warangal', te: 'వరంగల్' } },
  { id: 'yadadri-bhuvanagiri', name: { en: 'Yadadri Bhuvanagiri', te: 'యాదాద్రి భువనగిరి' } },
];

/** Mandals by district. Other districts accept free-text mandal names until their lists are added. */
export const MANDALS: Readonly<Record<string, readonly DistrictInfo[]>> = {
  narayanpet: [
    { id: 'damaragidda', name: { en: 'Damaragidda', te: 'దామరగిద్ద' } },
    { id: 'dhanwada', name: { en: 'Dhanwada', te: 'ధన్వాడ' } },
    { id: 'gundumal', name: { en: 'Gundumal', te: 'గుండుమల్' } },
    { id: 'kosgi', name: { en: 'Kosgi', te: 'కోస్గి' } },
    { id: 'kothapally', name: { en: 'Kothapally', te: 'కొత్తపల్లి' } },
    { id: 'krishna', name: { en: 'Krishna', te: 'కృష్ణ' } },
    { id: 'maddur', name: { en: 'Maddur', te: 'మద్దూర్' } },
    { id: 'maganoor', name: { en: 'Maganoor', te: 'మాగనూర్' } },
    { id: 'makthal', name: { en: 'Makthal', te: 'మక్తల్' } },
    { id: 'marikal', name: { en: 'Marikal', te: 'మరికల్' } },
    { id: 'narayanpet', name: { en: 'Narayanpet', te: 'నారాయణపేట' } },
    { id: 'narva', name: { en: 'Narva', te: 'నర్వ' } },
    { id: 'utkoor', name: { en: 'Utkoor', te: 'ఊట్కూర్' } },
  ],
};

export function getDistrict(id: string | null | undefined): DistrictInfo | undefined {
  return TELANGANA_DISTRICTS.find((d) => d.id === id);
}

export function getMandal(districtId: string | null | undefined, mandalId: string | null | undefined): DistrictInfo | undefined {
  if (!districtId || !mandalId) return undefined;
  return MANDALS[districtId]?.find((m) => m.id === mandalId);
}
