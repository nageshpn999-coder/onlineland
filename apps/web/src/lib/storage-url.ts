/** Public download URL for a file in Firebase Storage (listing photos are publicly readable by rule). */
const USE_EMULATORS = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-onlineland.appspot.com';

export function photoUrl(path: string): string {
  const host = USE_EMULATORS ? 'http://127.0.0.1:9199' : 'https://firebasestorage.googleapis.com';
  return `${host}/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`;
}

export const IMAGES_UNOPTIMIZED = USE_EMULATORS;
