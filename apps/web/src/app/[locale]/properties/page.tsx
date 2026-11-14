import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCategory, getDistrict, getMandal, type Locale } from '@onlineland/shared';
import { ChatIcon } from '@/components/icons';
import { ListingFilters } from '@/components/ListingFilters';
import { PropertyCard } from '@/components/PropertyCard';
import { SortSelect } from '@/components/SortSelect';
import { Link } from '@/i18n/navigation';
import { activeFilterCount, applyFilters, filtersToQuery, paginate, parseFilters } from '@/lib/listing-filters';
import { getApprovedProperties } from '@/lib/properties';
import { whatsappLink } from '@/lib/whatsapp';

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const { locale } = await params;
  const f = parseFilters(await searchParams);
  const t = await getTranslations({ locale, namespace: 'listings' });
  const title = f.purpose === 'rent' ? t('titleRent') : t('titleSale');
  return {
    title: t('metaTitle', { title }),
    alternates: { canonical: `/${locale}/properties`, languages: { te: '/te/properties', en: '/en/properties' } },
    // Filtered and paged variants stay out of the index; the main list is indexed.
    robots: activeFilterCount(f) > 0 || f.page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function PropertiesPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { locale: loc } = await params;
  setRequestLocale(loc);
  const locale = loc as Locale;
  const filters = parseFilters(await searchParams);
  const t = await getTranslations('listings');
  const ts = await getTranslations('search');

  const all = await getApprovedProperties();
  const results = applyFilters(all, filters);
  const { items, page, pages, total } = paginate(results, filters.page);
  const activeCount = activeFilterCount(filters);

  const chips = [
    filters.type && getCategory(filters.type)?.label[locale],
    filters.district && getDistrict(filters.district)?.name[locale],
    filters.mandal && getMandal(filters.district, filters.mandal)?.name[locale],
    filters.budget && ts.has(`${filters.purpose === 'rent' ? 'budgetsRent' : 'budgetsSale'}.${filters.budget}`)
      ? ts(`${filters.purpose === 'rent' ? 'budgetsRent' : 'budgetsSale'}.${filters.budget}`)
      : null,
  ].filter(Boolean) as string[];
  const query = [filters.purpose === 'rent' ? ts('rent') : ts('buy'), ...chips].join(', ');

  return (
    <div className="bg-mist">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-ink [font-stretch:90%] sm:text-[2.5rem]">
          {filters.purpose === 'rent' ? t('titleRent') : t('titleSale')}
        </h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Filters: collapsible on phones, always open on desktop */}
          <aside>
            <details className="group rounded-[var(--radius-plot)] border border-line bg-paper lg:hidden">
              <summary className="flex h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                <span>
                  {t('filters')}
                  {activeCount > 0 && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs text-white">{activeCount}</span>}
                </span>
                <span aria-hidden className="text-ink-soft transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="border-t border-line p-4">
                <ListingFilters filters={filters} />
              </div>
            </details>
            <div className="hidden rounded-[var(--radius-plot)] border border-line bg-paper p-5 lg:sticky lg:top-24 lg:block">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">{t('filters')}</h2>
                {activeCount > 0 && (
                  <Link href={{ pathname: '/properties', query: { purpose: filters.purpose } }} className="text-sm font-medium text-brand hover:underline">
                    {t('clear')}
                  </Link>
                )}
              </div>
              <ListingFilters filters={filters} />
            </div>
          </aside>

          <section aria-labelledby="results-count">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p id="results-count" className="font-semibold text-ink" aria-live="polite">
                {t('count', { count: total })}
              </p>
              <SortSelect filters={filters} />
            </div>
            {chips.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <li key={c} className="rounded-full bg-field-soft px-3 py-1 text-sm font-medium text-field">
                    {c}
                  </li>
                ))}
                <li>
                  <Link href={{ pathname: '/properties', query: { purpose: filters.purpose } }} className="inline-block px-2 py-1 text-sm font-medium text-brand hover:underline lg:hidden">
                    {t('clear')}
                  </Link>
                </li>
              </ul>
            )}

            {items.length > 0 ? (
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" data-testid="results">
                {items.map((p, i) => (
                  <li key={p.id}>
                    <PropertyCard property={p} priority={i < 3} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6 rounded-[var(--radius-plot)] border border-line bg-paper p-8 text-center sm:p-12">
                <h2 className="text-xl font-semibold text-ink">{t('emptyTitle')}</h2>
                <p className="mx-auto mt-2 max-w-md text-ink-soft">{t('emptyBody')}</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  <a
                    href={whatsappLink(t('emptyMessage', { query }))}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-field px-6 font-semibold text-white hover:bg-[#0b5532]"
                  >
                    <ChatIcon className="size-5" />
                    {t('emptyCta')}
                  </a>
                  {activeCount > 0 && (
                    <Link href={{ pathname: '/properties', query: { purpose: filters.purpose } }} className="font-medium text-brand hover:underline">
                      {t('clear')}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {pages > 1 && (
              <nav aria-label={t('pagination')} className="mt-10 flex items-center justify-between gap-4">
                {page > 1 ? (
                  <Link href={{ pathname: '/properties', query: filtersToQuery(filters, { page: page - 1 }) }} rel="prev" className="rounded-full border border-line bg-paper px-4 py-2 font-medium text-ink hover:border-brand">
                    {t('prev')}
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-sm text-ink-soft">{t('page', { page, pages })}</span>
                {page < pages ? (
                  <Link href={{ pathname: '/properties', query: filtersToQuery(filters, { page: page + 1 }) }} rel="next" className="rounded-full border border-line bg-paper px-4 py-2 font-medium text-ink hover:border-brand">
                    {t('next')}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
