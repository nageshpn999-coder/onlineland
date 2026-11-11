import { useLocale, useTranslations } from 'next-intl';
import { PROPERTY_CATEGORIES, type Locale } from '@onlineland/shared';
import { Link } from '@/i18n/navigation';
import { CATEGORY_ICONS } from './icons';

/** Categories laid out like parcels on a survey sheet; agricultural land, the core business, takes the largest parcel. */
export function Categories() {
  const t = useTranslations('categories');
  const locale = useLocale() as Locale;

  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <h2 className="text-[2rem] font-bold leading-tight tracking-tight text-ink [font-stretch:90%] sm:text-[2.4rem]">
          {t('title')}
        </h2>
        <p className="mt-3 text-ink-soft">{t('lead')}</p>
      </div>

      <ul className="mt-10 grid grid-cols-2 border-l border-t border-line lg:grid-cols-4">
        {PROPERTY_CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c.id]!;
          const isLead = c.id === 'agricultural';
          return (
            <li
              key={c.id}
              className={`border-b border-r border-line ${isLead ? 'col-span-2 lg:row-span-2' : ''}`}
            >
              <Link
                href={{ pathname: '/properties', query: { type: c.id, purpose: c.id === 'rental' ? 'rent' : 'sale' } }}
                className={`group relative flex h-full flex-col justify-between gap-6 p-5 hover:bg-mist sm:p-6 ${
                  isLead ? 'min-h-44 overflow-hidden bg-field-soft hover:bg-[#d8ebdf] lg:min-h-full' : 'min-h-28 sm:min-h-36'
                }`}
              >
                {isLead && (
                  <svg
                    aria-hidden
                    className="pointer-events-none absolute -bottom-4 -right-6 h-[70%] w-[75%] text-field opacity-[0.16]"
                    viewBox="0 0 300 200"
                    preserveAspectRatio="none"
                  >
                    {Array.from({ length: 11 }, (_, i) => (
                      <path
                        key={i}
                        d={`M0 ${200 - i * 16} Q 150 ${150 - i * 20}, 300 ${120 - i * 12}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                      />
                    ))}
                  </svg>
                )}
                <Icon className={`${isLead ? 'size-10 text-field' : 'size-8 text-brand'}`} />
                <span
                  className={`relative font-display font-semibold leading-snug text-ink ${
                    isLead ? 'text-[1.7rem] sm:text-[2rem]' : 'text-[1.15rem]'
                  }`}
                >
                  {c.label[locale]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
