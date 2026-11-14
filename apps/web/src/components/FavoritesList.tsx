'use client';

import { useLocale, useTranslations } from 'next-intl';
import { getCategory, type Locale } from '@onlineland/shared';
import { Link } from '@/i18n/navigation';
import { useFavorites } from '@/lib/favorites';
import { formatPrice } from '@/lib/format';
import { placeLabel } from '@/lib/place';

export function FavoritesList() {
  const t = useTranslations('favorites');
  const tf = useTranslations('featured');
  const locale = useLocale() as Locale;
  const { items, remove } = useFavorites();

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-[var(--radius-plot)] border border-line bg-paper p-8 text-center sm:p-12">
        <h2 className="text-xl font-semibold text-ink">{t('emptyTitle')}</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">{t('emptyBody')}</p>
        <Link href="/properties" className="mt-6 inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-deep">
          {t('browse')}
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 divide-y divide-line overflow-hidden rounded-[var(--radius-plot)] border border-line bg-paper" data-testid="favorites">
      {items.map((f) => (
        <li key={f.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-field">
              {f.code}, {getCategory(f.category)?.label[locale]}, {f.purpose === 'rent' ? tf('forRent') : tf('forSale')}
            </p>
            <Link href={`/properties/${f.code}`} className="mt-0.5 block text-lg font-semibold text-ink hover:text-brand">
              {f.title[locale] || f.title.te || f.title.en}
            </Link>
            <p className="text-sm text-ink-soft">{placeLabel(f, locale)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <p className="font-display text-xl font-bold text-ink">{formatPrice(f.total, locale)}</p>
            <button type="button" onClick={() => remove(f.id)} className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:border-red-600 hover:text-red-700">
              {t('remove')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
