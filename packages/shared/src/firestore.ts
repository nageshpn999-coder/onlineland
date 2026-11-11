/** Firestore collection names. Use these instead of string literals everywhere. */
export const COLLECTIONS = {
  users: 'users',
  favorites: 'favorites', // sub-collection of users/{uid}
  properties: 'properties',
  media: 'media', // sub-collection of properties/{id}
  privateData: 'private', // sub-collection of properties/{id}; owner contact lives here
  locations: 'locations',
  leads: 'leads',
  siteVisits: 'siteVisits',
  plans: 'plans',
  subscriptions: 'subscriptions',
  notifications: 'notifications',
  auditLogs: 'auditLogs',
  settings: 'settings',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Cloud Functions region (Mumbai). */
export const FUNCTIONS_REGION = 'asia-south1';
