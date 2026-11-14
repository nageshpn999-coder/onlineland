import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { PublicProperty } from '@/lib/property-types';
import { PropertyCard } from './PropertyCard';

/** Homepage: featured listings first, then the newest approved ones. Hidden when there are none yet. */
export function FeaturedProperties({ properties }: { properties: PublicProperty[] }) {
  const t = useTranslations('featured');
  if (properties.length === 0) return null;

  return (
    <section id="featured" className="border-y border-line bg-mist">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[2rem] font-bold leading-tight tracking-tight text-ink [font-stretch:90%] sm:text-[2.4rem]">
              {t('title')}
            </h2>
            <p className="mt-2 text-ink-soft">{t('lead')}</p>
          </div>
          <Link href="/properties" className="font-semibold text-brand hover:underline">
            {t('viewAll')}
          </Link>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <li key={p.id}>
              <PropertyCard property={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
