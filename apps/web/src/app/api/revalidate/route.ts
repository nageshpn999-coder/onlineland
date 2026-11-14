import { revalidateTag } from 'next/cache';
import { PROPERTIES_TAG } from '@/lib/properties';

/**
 * Called by Cloud Functions after a listing is approved, edited or sold, so the website
 * shows the change at once instead of after the 60-second cache.
 * POST with header `x-revalidate-secret: <REVALIDATE_SECRET>`.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  revalidateTag(PROPERTIES_TAG, 'max');
  return Response.json({ ok: true, revalidated: PROPERTIES_TAG });
}
