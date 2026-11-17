import type { MetadataRoute } from 'next';
import { BRAND } from '@onlineland/shared';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${BRAND.domain}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/te/favorites', '/en/favorites'] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
