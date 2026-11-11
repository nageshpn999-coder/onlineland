import { useLocale, useTranslations } from 'next-intl';
import { AREA_UNITS, getCategory, type Locale } from '@onlineland/shared';
import { SAMPLE_PROPERTIES } from '@/data/sample-properties';
import { formatPrice } from '@/lib/format';
import { whatsappLink } from '@/lib/whatsapp';
import { AreaIcon, ChatIcon, PinIcon } from './icons';
import { PropertyArt } from './PropertyArt';

export function FeaturedProperties() {
  const t = useTranslations('featured');
  const locale = useLocale() as Locale;

  return (
    <section id="featured" className="border-y border-line bg-mist">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[2rem] font-bold leading-tight tracking-tight text-ink [font-stretch:90%] sm:text-[2.4rem]">
            {t('title')}
          </h2>
          <p className="max-w-md text-sm text-ink-soft sm:text-right">{t('sampleNote')}</p>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_PROPERTIES.map((p) => {
            const category = getCategory(p.category);
            const unit = AREA_UNITS.find((u) => u.id === p.areaUnit)!;
            const title = p.title[locale];
            const place = p.place[locale];
            const suffix =
              p.priceBasis === 'per-unit' ? ` ${t('perAcre')}` : p.priceBasis === 'per-month' ? ` ${t('perMonth')}` : '';

            return (
              <li key={p.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-plot)] border border-line bg-paper">
                  <div className="relative aspect-[16/10]">
                    <PropertyArt category={p.category} />
                    <span className="absolute left-3 top-3 rounded-full border border-ink/15 bg-paper px-2.5 py-0.5 text-xs font-semibold text-ink-soft">
                      {t('sample')}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm font-medium text-field">
                      {category?.label[locale]}, {p.purpose === 'rent' ? t('forRent') : t('forSale')}
                    </p>
                    <h3 className="mt-1 text-[1.25rem] font-semibold leading-snug text-ink">{title}</h3>

                    <dl className="mt-3 space-y-1.5 text-[0.95rem] text-ink-soft">
                      <div className="flex items-center gap-2">
                        <dt className="sr-only">Location</dt>
                        <PinIcon className="size-[18px] shrink-0" />
                        <dd>{place}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt className="sr-only">Area</dt>
                        <AreaIcon className="size-[18px] shrink-0" />
                        <dd>
                          {p.area.toLocaleString('en-IN')}{' '}
                          {locale === 'en' && p.area === 1 ? unit.label.en.replace(/s$/, '') : unit.label[locale]}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                      <p className="font-display text-[1.45rem] font-bold leading-none text-ink">
                        {formatPrice(p.price, locale)}
                        {suffix && <span className="ml-1 font-sans text-sm font-normal text-ink-soft">{suffix}</span>}
                      </p>
                      <a
                        href={whatsappLink(t('askMessage', { title, place }))}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-field/40 px-3.5 py-2 text-sm font-semibold text-field hover:bg-field hover:text-white"
                      >
                        <ChatIcon className="size-[18px]" />
                        {t('ask')}
                      </a>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
