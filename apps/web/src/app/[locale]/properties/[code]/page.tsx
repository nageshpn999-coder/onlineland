import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BRAND, getCategory, getDistrict, type Locale } from '@onlineland/shared';
import { ContactActions } from '@/components/ContactActions';
import { EnquiryForm } from '@/components/EnquiryForm';
import { FavoriteButton } from '@/components/FavoriteButton';
import { areaText } from '@/components/PropertyCard';
import { PropertyGallery } from '@/components/PropertyGallery';
import { SiteVisitForm } from '@/components/SiteVisitForm';
import { Link } from '@/i18n/navigation';
import { formatPrice } from '@/lib/format';
import { placeLabel } from '@/lib/place';
import { getPropertyByCode, getPropertyPhotos } from '@/lib/properties';
import { photoUrl } from '@/lib/storage-url';

type Params = Promise<{ locale: string; code: string }>;

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, code } = await params;
  const p = await getPropertyByCode(code);
  if (!p) return { title: 'OnlineLand', robots: { index: false } };
  const l = locale as Locale;
  const title = `${p.title[l] || p.title.te || p.title.en} — ${formatPrice(p.total, l)} | OnlineLand`;
  const description = `${getCategory(p.category)?.label[l]}, ${areaText(p, l)}, ${placeLabel(p.location, l)}. ${p.code}`;
  return {
    title,
    description,
    alternates: { canonical: `/${locale}/properties/${p.code}`, languages: { te: `/te/properties/${p.code}`, en: `/en/properties/${p.code}` } },
    openGraph: { title, description, type: 'website', images: p.coverPath ? [photoUrl(p.coverPath)] : undefined },
  };
}

export default async function PropertyPage({ params }: { params: Params }) {
  const { locale: loc, code } = await params;
  setRequestLocale(loc);
  const locale = loc as Locale;
  const p = await getPropertyByCode(code);
  if (!p) notFound();

  const t = await getTranslations('property');
  const tf = await getTranslations('featured');
  const tv = await getTranslations('visit');
  const photos = (await getPropertyPhotos(p.id)).map((ph) => ph.path);
  const title = p.title[locale] || p.title.te || p.title.en;
  const description = p.description[locale] || p.description.te || p.description.en;
  const category = getCategory(p.category);
  const district = getDistrict(p.location.district);
  const hasMap = p.location.lat !== null && p.location.lng !== null;
  const mapQuery = hasMap ? `${p.location.lat},${p.location.lng}` : `${placeLabel(p.location, 'en')}, Telangana`;

  const facts: [string, string][] = [
    [t('code'), p.code],
    [t('category'), `${category?.label[locale] ?? p.category}, ${p.purpose === 'rent' ? tf('forRent') : tf('forSale')}`],
    [t('area'), areaText(p, locale)],
    [t('location'), placeLabel(p.location, locale)],
  ];
  if (p.facing) facts.push([t('facing'), t.has(`facings.${p.facing}`) ? t(`facings.${p.facing}`) : p.facing]);
  if (p.roadAccess !== null) facts.push([t('road'), p.roadAccess ? t('yes') : t('no')]);
  if (p.waterSource) facts.push([t('water'), p.waterSource]);
  if (p.rera) facts.push([t('rera'), p.rera]);
  if (p.docsVerified) facts.push([t('docs'), t('docsVerified')]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    url: `https://${BRAND.domain}/${locale}/properties/${p.code}`,
    datePosted: new Date(p.createdAt).toISOString().slice(0, 10),
    image: photos.slice(0, 5).map(photoUrl),
    offers: { '@type': 'Offer', price: p.total, priceCurrency: 'INR', availability: 'https://schema.org/InStock' },
  };

  return (
    <div className="pb-24 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-brand">
                {t('home')}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={{ pathname: '/properties', query: { purpose: p.purpose, type: p.category } }} className="hover:text-brand">
                {category?.label[locale]}
              </Link>
            </li>
            {district && (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link href={{ pathname: '/properties', query: { purpose: p.purpose, district: district.id } }} className="hover:text-brand">
                    {district.name[locale]}
                  </Link>
                </li>
              </>
            )}
          </ol>
        </nav>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-field">{p.code}</p>
            <h1 className="mt-1 text-[1.9rem] font-bold leading-tight tracking-tight text-ink [font-stretch:90%] sm:text-[2.4rem]">{title}</h1>
            <p className="mt-1 text-ink-soft">{placeLabel(p.location, locale)}</p>
          </div>
          <FavoriteButton
            variant="full"
            item={{
              id: p.id,
              code: p.code,
              category: p.category,
              purpose: p.purpose,
              title: p.title,
              district: p.location.district,
              mandal: p.location.mandal,
              village: p.location.village,
              total: p.total,
            }}
          />
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          <div className="min-w-0 space-y-10">
            <PropertyGallery photos={photos} title={title} category={p.category} />

            <section aria-labelledby="facts">
              <h2 id="facts" className="text-xl font-semibold text-ink">
                {t('details')}
              </h2>
              <dl className="mt-4 grid border-l border-t border-line sm:grid-cols-2">
                {facts.map(([k, v]) => (
                  <div key={k} className="border-b border-r border-line px-4 py-3">
                    <dt className="text-sm text-ink-soft">{k}</dt>
                    <dd className="mt-0.5 font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {description && (
              <section aria-labelledby="about">
                <h2 id="about" className="text-xl font-semibold text-ink">
                  {t('about')}
                </h2>
                <p className="mt-3 max-w-[70ch] whitespace-pre-line text-ink">{description}</p>
              </section>
            )}

            <section aria-labelledby="map">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="map" className="text-xl font-semibold text-ink">
                  {t('map')}
                </h2>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener"
                  className="text-sm font-medium text-brand hover:underline"
                >
                  {t('openMap')}
                </a>
              </div>
              {hasMap && (
                <iframe
                  title={`${t('map')}: ${title}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="mt-4 aspect-[16/9] w-full rounded-[var(--radius-plot)] border border-line"
                />
              )}
            </section>

            <section aria-labelledby="visit" className="rounded-[var(--radius-plot)] border border-line bg-mist p-5 sm:p-6">
              <h2 id="visit" className="text-xl font-semibold text-ink">
                {tv('title')}
              </h2>
              <p className="mb-5 mt-1 text-ink-soft">{tv('lead')}</p>
              <SiteVisitForm propertyId={p.id} />
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[var(--radius-plot)] border border-line bg-paper p-5 sm:p-6">
              <p className="text-sm text-ink-soft">{p.purpose === 'rent' ? tf('forRent') : t('total')}</p>
              <p className="font-display text-[2.1rem] font-bold leading-tight text-ink">
                {formatPrice(p.total, locale)}
                {p.priceBasis === 'per-month' && <span className="ml-1 font-sans text-base font-normal text-ink-soft">{tf('perMonth')}</span>}
              </p>
              {p.priceBasis === 'per-unit' && (
                <p className="text-ink-soft">
                  {formatPrice(p.price, locale)} {tf(`perUnit.${p.areaUnit}`)}
                </p>
              )}

              <div className="mt-5">
                <ContactActions propertyId={p.id} code={p.code} title={title} />
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <h2 className="text-lg font-semibold text-ink">{t('contactTitle')}</h2>
                <p className="mb-4 mt-1 text-sm text-ink-soft">{t('contactNote')}</p>
                <EnquiryForm propertyId={p.id} />
              </div>
            </div>
          </aside>
        </div>
      </div>
      <ContactActions propertyId={p.id} code={p.code} title={title} variant="bar" />
    </div>
  );
}
