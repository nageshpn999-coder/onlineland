'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/track';

/** Counts one view of a listing (for the owner's stats). Renders nothing. */
export function TrackView({ propertyId }: { propertyId: string }) {
  useEffect(() => trackEvent(propertyId, 'view'), [propertyId]);
  return null;
}
