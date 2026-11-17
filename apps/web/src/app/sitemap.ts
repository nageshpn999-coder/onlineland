import type { MetadataRoute } from 'next';
import { BRAND, LOCALES } from '@onlineland/shared';
import { LEGAL_DOCS } from '@/lib/legal';
import { getApprovedProperties } from '@/lib/properties';

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${BRAND.domain}`;

/** Every public page in Telugu and English, with each other as language alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entry = (path: string, priority: number, lastModified?: Date): MetadataRoute.Sitemap[number] => ({
    url: `${SITE}/te${path}`,
    lastModified,
    priority,
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE}/${l}${path}`])) },
  });
  const properties = await getApprovedProperties();
  return [
    entry('', 1),
    entry('/properties', 0.9),
    entry('/properties?purpose=rent', 0.6),
    ...properties.map((p) => entry(`/properties/${p.code}`, p.isFeatured ? 0.8 : 0.7, new Date(p.createdAt))),
    ...LEGAL_DOCS.map((d) => entry(`/legal/${d}`, 0.2)),
  ].flatMap((e) => [e, { ...e, url: e.url.replace(`${SITE}/te`, `${SITE}/en`) }]);
}
