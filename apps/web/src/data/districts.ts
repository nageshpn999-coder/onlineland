/**
 * Districts offered as suggestions in the search box.
 * Phase 4 replaces this with the Firestore `locations` collection (district → mandal → village).
 */
export const SEARCH_DISTRICTS = [
  'narayanpet',
  'mahabubnagar',
  'hyderabad',
  'rangareddy',
  'sangareddy',
  'vikarabad',
  'nagarkurnool',
  'wanaparthy',
  'gadwal',
  'medchal',
] as const;

export const SALE_BUDGETS = ['0-1000000', '1000000-2500000', '2500000-5000000', '5000000-10000000', '10000000-'] as const;
export const RENT_BUDGETS = ['0-10000', '10000-25000', '25000-50000', '50000-'] as const;
