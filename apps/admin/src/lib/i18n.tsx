'use client';

/**
 * Admin dashboard language: Telugu (default) or English, remembered in this browser.
 * Data stays as entered; only the interface text changes.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Locale } from '@onlineland/shared';

const te = {
  appName: 'OnlineLand అడ్మిన్',
  overview: 'సారాంశం',
  listings: 'ప్రాపర్టీలు',
  leads: 'Leads (CRM)',
  visits: 'సైట్ విజిట్స్',
  users: 'యూజర్లు',
  payments: 'చెల్లింపులు',
  settings: 'ధరలు & సెట్టింగ్స్',
  audit: 'ఆడిట్ లాగ్',
  signOut: 'లాగౌట్',
  loginTitle: 'అడ్మిన్ లాగిన్',
  loginHint: 'మీ admin మొబైల్ నంబర్‌కు OTP వస్తుంది.',
  mobile: 'మొబైల్ నంబర్',
  sendOtp: 'OTP పంపండి',
  otp: 'OTP',
  verify: 'లాగిన్ అవ్వండి',
  changeNumber: 'నంబర్ మార్చండి',
  notAdmin: 'ఈ నంబర్‌కు అడ్మిన్ అనుమతి లేదు.',
  loading: 'లోడ్ అవుతోంది…',
  empty: 'ఇక్కడ ఇంకా ఏమీ లేవు.',
  retry: 'మళ్లీ ప్రయత్నించండి',
  save: 'సేవ్ చేయండి',
  saved: 'సేవ్ అయింది',
  cancel: 'రద్దు',
  close: 'మూసివేయండి',
  search: 'వెతకండి',
  all: 'అన్నీ',
  pendingListings: 'ఆమోదం కోసం ప్రాపర్టీలు',
  newLeads: 'కొత్త leads',
  pendingPayments: 'చెక్ చేయాల్సిన చెల్లింపులు',
  requestedVisits: 'కొత్త విజిట్ అభ్యర్థనలు',
  liveListings: 'Live ప్రాపర్టీలు',
  activeDealers: 'Active ప్లాన్ dealers',
  open: 'తెరవండి',
  approve: 'ఆమోదించండి',
  reject: 'తిరస్కరించండి',
  rejectReason: 'తిరస్కరణ కారణం',
  approved: 'ఆమోదించబడింది',
  rejected: 'తిరస్కరించబడింది',
  status: 'స్థితి',
  price: 'ధర',
  area: 'విస్తీర్ణం',
  location: 'లొకేషన్',
  owner: 'ఓనర్',
  ownerContact: 'ఓనర్ నంబర్ (ప్రైవేట్)',
  photos: 'ఫోటోలు',
  featured: 'Featured (పైన)',
  featureWeek: '7 రోజులు featured',
  unfeature: 'Featured తీసివేయండి',
  markSold: 'అమ్ముడైంది',
  docsVerified: 'డాక్యుమెంట్లు చెక్ చేశాం',
  stats: 'Views / Shares / Leads',
  limitReached: 'లిమిట్ దాటింది',
  stage: 'దశ',
  notes: 'నోట్స్',
  assignAgent: 'Agent కి ఇవ్వండి',
  unassigned: 'ఎవరికీ ఇవ్వలేదు',
  viaDealer: 'Dealer లింక్ ద్వారా',
  direct: 'OnlineLand',
  call: 'కాల్',
  whatsapp: 'WhatsApp',
  property: 'ప్రాపర్టీ',
  date: 'తేదీ',
  slot: 'సమయం',
  role: 'Role',
  changeRole: 'Role మార్చండి',
  verified: '✓ Verified',
  giveBadge: '✓ బ్యాడ్జ్ ఇవ్వండి',
  removeBadge: 'బ్యాడ్జ్ తీసివేయండి',
  plan: 'ప్లాన్',
  validUntil: 'గడువు',
  noPlan: 'ఉచిత ప్లాన్',
  utr: 'UTR నంబర్',
  amount: 'మొత్తం',
  expected: 'అసలు ధర',
  kind: 'దేని కోసం',
  kindPlan: 'ప్లాన్',
  kindFeatured: 'Featured వారం',
  kindListing: 'అదనపు listing',
  checkBank: 'మీ బ్యాంక్/UPI యాప్‌లో ఈ UTR తో డబ్బు వచ్చిందో చూసి ఆమోదించండి.',
  plans: 'ప్లాన్‌లు',
  pricing: 'ఇతర ధరలు',
  planPrice: 'నెల ధర (₹)',
  durationDays: 'రోజులు',
  listingLimit: 'Listings (0 = అపరిమితం)',
  featuredSlots: 'Featured slots',
  ownContact: 'షేర్ లింక్‌లో సొంత నంబర్',
  dealerPage: 'సొంత dealer పేజీ',
  areaLeads: 'ఏరియా leads',
  featuredWeekInr: 'Featured ఒక వారం (₹)',
  featuredDays: 'Featured రోజులు',
  ownerFreeListings: 'ఓనర్ ఉచిత listings',
  ownerListingInr: 'అదనపు listing (₹)',
  ownerListingDays: 'అదనపు listing రోజులు',
  renewalReminderDays: 'Renewal గుర్తు (రోజుల ముందు)',
  upiId: 'మీ UPI ID',
  upiName: 'UPI పేరు',
  runJob: 'రోజువారీ పని ఇప్పుడే నడపండి',
  jobDone: 'పూర్తయింది',
  action: 'పని',
  actor: 'ఎవరు',
  when: 'ఎప్పుడు',
  target: 'దేనిపై',
  agentView: 'మీకు ఇచ్చిన leads మరియు విజిట్స్ మాత్రమే కనిపిస్తాయి.',
  language: 'English',
};

export type Key = keyof typeof te;

const en: Record<Key, string> = {
  appName: 'OnlineLand Admin',
  overview: 'Overview',
  listings: 'Listings',
  leads: 'Leads (CRM)',
  visits: 'Site visits',
  users: 'Users',
  payments: 'Payments',
  settings: 'Prices & settings',
  audit: 'Audit log',
  signOut: 'Sign out',
  loginTitle: 'Admin sign-in',
  loginHint: 'An OTP will be sent to your admin mobile number.',
  mobile: 'Mobile number',
  sendOtp: 'Send OTP',
  otp: 'OTP',
  verify: 'Sign in',
  changeNumber: 'Change number',
  notAdmin: 'This number does not have admin access.',
  loading: 'Loading…',
  empty: 'Nothing here yet.',
  retry: 'Try again',
  save: 'Save',
  saved: 'Saved',
  cancel: 'Cancel',
  close: 'Close',
  search: 'Search',
  all: 'All',
  pendingListings: 'Listings to review',
  newLeads: 'New leads',
  pendingPayments: 'Payments to check',
  requestedVisits: 'New visit requests',
  liveListings: 'Live listings',
  activeDealers: 'Dealers on a paid plan',
  open: 'Open',
  approve: 'Approve',
  reject: 'Reject',
  rejectReason: 'Reason for rejection',
  approved: 'Approved',
  rejected: 'Rejected',
  status: 'Status',
  price: 'Price',
  area: 'Area',
  location: 'Location',
  owner: 'Owner',
  ownerContact: 'Owner number (private)',
  photos: 'Photos',
  featured: 'Featured (on top)',
  featureWeek: 'Feature for 7 days',
  unfeature: 'Remove featured',
  markSold: 'Mark sold',
  docsVerified: 'Documents checked',
  stats: 'Views / Shares / Leads',
  limitReached: 'Limit reached',
  stage: 'Stage',
  notes: 'Notes',
  assignAgent: 'Assign agent',
  unassigned: 'Unassigned',
  viaDealer: 'Via dealer link',
  direct: 'OnlineLand',
  call: 'Call',
  whatsapp: 'WhatsApp',
  property: 'Property',
  date: 'Date',
  slot: 'Time',
  role: 'Role',
  changeRole: 'Change role',
  verified: '✓ Verified',
  giveBadge: 'Give ✓ badge',
  removeBadge: 'Remove badge',
  plan: 'Plan',
  validUntil: 'Valid until',
  noPlan: 'Free plan',
  utr: 'UTR number',
  amount: 'Amount',
  expected: 'Price',
  kind: 'For',
  kindPlan: 'Plan',
  kindFeatured: 'Featured week',
  kindListing: 'Extra listing',
  checkBank: 'Check in your bank/UPI app that money with this UTR arrived, then approve.',
  plans: 'Plans',
  pricing: 'Other prices',
  planPrice: 'Price per month (₹)',
  durationDays: 'Days',
  listingLimit: 'Listings (0 = unlimited)',
  featuredSlots: 'Featured slots',
  ownContact: 'Own number on share links',
  dealerPage: 'Own dealer page',
  areaLeads: 'Area leads',
  featuredWeekInr: 'Featured one week (₹)',
  featuredDays: 'Featured days',
  ownerFreeListings: 'Owner free listings',
  ownerListingInr: 'Extra listing (₹)',
  ownerListingDays: 'Extra listing days',
  renewalReminderDays: 'Renewal reminder (days before)',
  upiId: 'Your UPI ID',
  upiName: 'UPI name',
  runJob: 'Run the daily job now',
  jobDone: 'Done',
  action: 'Action',
  actor: 'By',
  when: 'When',
  target: 'On',
  agentView: 'You see only the leads and visits assigned to you.',
  language: 'తెలుగు',
};

const DICTS: Record<Locale, Record<Key, string>> = { te, en };

interface I18n {
  locale: Locale;
  t: (k: Key) => string;
  toggle: () => void;
}

const Ctx = createContext<I18n>({ locale: 'te', t: (k) => te[k], toggle: () => undefined });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('te');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ol-admin-locale');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after hydration
      if (saved === 'en' || saved === 'te') setLocale(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const toggle = useCallback(() => {
    setLocale((l) => {
      const next = l === 'te' ? 'en' : 'te';
      try {
        localStorage.setItem('ol-admin-locale', next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  const t = useCallback((k: Key) => DICTS[locale][k], [locale]);
  return <Ctx.Provider value={{ locale, t, toggle }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
