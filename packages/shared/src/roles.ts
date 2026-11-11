/**
 * Roles stored as Firebase Auth custom claims. Only a Cloud Function may set them.
 * "visitor" is anyone not logged in and is never stored.
 */
export const ROLES = ['buyer', 'owner', 'dealer', 'agent', 'admin'] as const;
export type Role = (typeof ROLES)[number];
export const DEFAULT_ROLE: Role = 'buyer';

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
