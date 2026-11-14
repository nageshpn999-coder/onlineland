import type {
  AreaUnit,
  LocalizedText,
  PriceBasis,
  PropertyCategory,
  PropertyLocation,
  PropertyPurpose,
} from '@onlineland/shared';

/**
 * What the public website may show about an approved listing.
 * Owner id, contact and review details are never included.
 * Plain JSON (timestamps as milliseconds) so it can be cached and sent to client components.
 */
export interface PublicProperty {
  id: string;
  code: string;
  category: PropertyCategory;
  purpose: PropertyPurpose;
  title: LocalizedText;
  description: LocalizedText;
  price: number;
  priceBasis: PriceBasis;
  /** Total price (sale) or monthly rent, after per-acre pricing is multiplied out. */
  total: number;
  area: number;
  areaUnit: AreaUnit;
  location: PropertyLocation;
  facing: string | null;
  roadAccess: boolean | null;
  waterSource: string | null;
  rera: string | null;
  coverPath: string | null;
  photoCount: number;
  isFeatured: boolean;
  docsVerified: boolean;
  createdAt: number;
}

export interface PropertyPhoto {
  path: string;
  isCover: boolean;
}
