'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SORTS, type ListingFilters } from '@/lib/listing-filters';

/** Sort control; carries the current filters as hidden fields so it can submit on its own. */
export function SortSelect({ filters }: { filters: ListingFilters }) {
  const t = useTranslations('listings');
  const locale = useLocale();
  const id = useId();
  const hidden = { purpose: filters.purpose, type: filters.type, district: filters.district, mandal: filters.mandal, budget: filters.budget };

  return (
    <form action={`/${locale}/properties`} method="get" className="flex items-center gap-2">
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label htmlFor={id} className="text-sm text-ink-soft">
        {t('sort')}
      </label>
      <select
        id={id}
        name="sort"
        defaultValue={filters.sort}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-10 rounded-[var(--radius-plot)] border border-line bg-paper px-2 text-sm text-ink outline-none focus:border-brand"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {t(`sorts.${s}`)}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="h-10 rounded-[var(--radius-plot)] border border-line px-3 text-sm">
          {t('apply')}
        </button>
      </noscript>
    </form>
  );
}
