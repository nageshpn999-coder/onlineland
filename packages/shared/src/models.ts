/**
 * Firestore document shapes. One definition for website, admin and app (Dart mirrors these in Phase 6).
 * Timestamps are typed generically so both client and admin SDK Timestamp classes fit.
 * Security rules in firebase/firestore.rules enforce the same field lists.
 */
import type { Locale, LocalizedText } from './i18n';
import type { Role } from './roles';
import type { AreaUnit, PriceBasis, PropertyCategory, PropertyPurpose, PropertySource, PropertyStatus } from './property';
import type { LeadChannel, LeadStage, PaymentMethod, SiteVisitStatus } from './leads';

export interface TimestampLike {
  toMillis(): number;
}

/** users/{uid} — created by the onUserCreated Cloud Function. */
export interface UserProfile<T = TimestampLike> {
  name: string;
  phone: string | null;
  email: string | null;
  role: Role; // mirror of the custom claim; only Cloud Functions write it
  language: Locale;
  status: 'active' | 'blocked';
  createdAt: T;
  updatedAt?: T;
}

/** users/{uid}/favorites/{propertyId} */
export interface Favorite<T = TimestampLike> {
  savedAt: T;
}

export interface PropertyLocation {
  district: string; // locations/{id} of level "district", e.g. "narayanpet"
  mandal: string; // e.g. "makthal"
  village: string; // free text until the village list is complete
  lat: number | null;
  lng: number | null;
}

/** Fields an owner/dealer may write on their own listing. */
export const PROPERTY_EDITABLE_FIELDS = [
  'category',
  'purpose',
  'title',
  'description',
  'price',
  'priceBasis',
  'area',
  'areaUnit',
  'location',
  'facing',
  'roadAccess',
  'waterSource',
  'rera',
  'coverPath',
  'photoCount',
] as const;

/** properties/{id} */
export interface Property<T = TimestampLike> {
  code: string | null; // human-friendly code shown to buyers, e.g. "OL-1042" (set by Cloud Function on first approval)
  category: PropertyCategory;
  purpose: PropertyPurpose;
  title: LocalizedText;
  description: LocalizedText;
  price: number; // rupees
  priceBasis: PriceBasis;
  area: number;
  areaUnit: AreaUnit;
  location: PropertyLocation;
  facing: 'east' | 'west' | 'north' | 'south' | 'north-east' | 'north-west' | 'south-east' | 'south-west' | null;
  roadAccess: boolean | null;
  waterSource: string | null;
  rera: string | null;
  coverPath: string | null; // Storage path of the cover photo
  photoCount: number;

  ownerId: string;
  source: PropertySource;
  status: PropertyStatus;
  isFeatured: boolean;
  featuredUntil: T | null;
  docsVerified: boolean;
  rejectReason: string | null;
  reviewedBy: string | null;
  reviewedAt: T | null;
  createdAt: T;
  updatedAt: T;
}

/** properties/{id}/media/{mediaId} */
export interface PropertyMedia<T = TimestampLike> {
  storagePath: string;
  order: number;
  isCover: boolean;
  createdAt: T;
}

/** properties/{id}/private/contact — never public (decision D3). */
export interface PropertyPrivateContact {
  ownerName: string;
  ownerPhone: string;
  address: string | null;
  commissionTerms: string | null;
}

/** locations/{id} */
export interface Location {
  name: LocalizedText;
  level: 'district' | 'mandal' | 'village';
  parentId: string | null;
}

/** leads/{id} — created by visitors (login optional). */
export interface Lead<T = TimestampLike> {
  propertyId: string | null;
  channel: LeadChannel;
  name: string | null;
  phone: string | null; // 10-digit Indian mobile, required for the form channel
  message: string | null;
  locale: Locale;
  userId: string | null;
  stage: LeadStage;
  assignedAgentId: string | null;
  notes: string | null;
  createdAt: T;
  updatedAt?: T;
}

/** siteVisits/{id} */
export interface SiteVisit<T = TimestampLike> {
  propertyId: string;
  leadId: string | null;
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  slot: 'morning' | 'afternoon' | 'evening';
  status: SiteVisitStatus;
  userId: string | null;
  agentId: string | null;
  notes: string | null;
  createdAt: T;
  updatedAt?: T;
}

/** plans/{id} */
export interface Plan {
  name: LocalizedText;
  priceInr: number;
  durationDays: number;
  listingLimit: number;
  featuredSlots: number;
  active: boolean;
}

/** subscriptions/{id} — written only by Cloud Functions after admin confirms the UPI payment (D6). */
export interface Subscription<T = TimestampLike> {
  dealerId: string;
  planId: string;
  method: PaymentMethod;
  upiReference: string;
  status: 'pending' | 'active' | 'expired' | 'rejected';
  validUntil: T | null;
  confirmedBy: string | null;
  createdAt: T;
}

/** auditLogs/{id} — written only by Cloud Functions. */
export interface AuditLog<T = TimestampLike> {
  actorId: string;
  action: string; // e.g. "property.approve", "user.setRole"
  target: string; // e.g. "properties/abc"
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  at: T;
}
