/**
 * Counts listing views and shares for the owner's stats (Cloud Function trackEvent).
 * Fire-and-forget: never blocks the page; a view counts once per browser tab session.
 */
export function trackEvent(propertyId: string, type: 'view' | 'share') {
  if (type === 'view') {
    try {
      const key = `ol-viewed-${propertyId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* storage unavailable: still count */
    }
  }
  Promise.all([import('firebase/functions'), import('./firebase/client')])
    .then(([{ httpsCallable }, { firebaseClient }]) => httpsCallable(firebaseClient().functions, 'trackEvent')({ propertyId, type }))
    .catch((err) => console.warn('[track]', err?.message));
}
