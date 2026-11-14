'use client';

import { useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MANDALS, PROPERTY_CATEGORIES, TELANGANA_DISTRICTS, type Locale } from '@onlineland/shared';
import { RENT_BUDGETS, SALE_BUDGETS } from '@/data/districts';
import type { ListingFilters as Filters } from '@/lib/listing-filters';

/**
 * Filter form for /properties. A plain GET form (works without JavaScript);
 * with JavaScript every change applies immediately.
 */
export function ListingFilters({ filters }: { filters: Filters }) {
  const t = useTranslations('listings');
  const ts = useTranslations('search');
  const locale = useLocale() as Locale;
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [purpose, setPurpose] = useState(filters.purpose);
  const [district, setDistrict] = useState(filters.district ?? '');

  const mandals = MANDALS[district] ?? [];
  const budgets = purpose === 'sale' ? SALE_BUDGETS : RENT_BUDGETS;
  const budgetKey = purpose === 'sale' ? 'budgetsSale' : 'budgetsRent';
  const submit = () => form.current?.requestSubmit();

  const field =
    'block h-11 w-full rounded-[var(--radius-plot)] border border-line bg-paper px-3 text-[0.95rem] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
  const label = 'mb-1.5 block text-sm font-medium text-ink-soft';

  return (
    <form ref={form} action={`/${locale}/properties`} method="get" className="space-y-5" onChange={submit}>
      {filters.sort !== 'newest' && <input type="hidden" name="sort" value={filters.sort} />}

      <fieldset className="inline-flex rounded-full bg-mist p-1">
        <legend className="sr-only">{ts('label')}</legend>
        {(['sale', 'rent'] as const).map((p) => (
          <label
            key={p}
            className={`cursor-pointer rounded-full px-5 py-1.5 text-[0.95rem] font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
              purpose === p ? 'bg-brand text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <input type="radio" name="purpose" value={p} checked={purpose === p} onChange={() => setPurpose(p)} className="sr-only" />
            {p === 'sale' ? ts('buy') : ts('rent')}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor={`${id}-type`} className={label}>
          {ts('type')}
        </label>
        <select id={`${id}-type`} name="type" defaultValue={filters.type ?? ''} className={field}>
          <option value="">{ts('anyType')}</option>
          {PROPERTY_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label[locale]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${id}-district`} className={label}>
          {t('district')}
        </label>
        <select
          id={`${id}-district`}
          name="district"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className={field}
        >
          <option value="">{t('anyDistrict')}</option>
          {TELANGANA_DISTRICTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name[locale]}
            </option>
          ))}
        </select>
      </div>

      {mandals.length > 0 && (
        <div>
          <label htmlFor={`${id}-mandal`} className={label}>
            {t('mandal')}
          </label>
          <select key={district} id={`${id}-mandal`} name="mandal" defaultValue={filters.mandal ?? ''} className={field}>
            <option value="">{t('anyMandal')}</option>
            {mandals.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name[locale]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor={`${id}-budget`} className={label}>
          {ts('budget')}
        </label>
        <select key={purpose} id={`${id}-budget`} name="budget" defaultValue={purpose === filters.purpose ? (filters.budget ?? '') : ''} className={field}>
          <option value="">{ts('anyBudget')}</option>
          {budgets.map((b) => (
            <option key={b} value={b}>
              {ts(`${budgetKey}.${b}`)}
            </option>
          ))}
        </select>
      </div>

      <noscript>
        <button type="submit" className="h-11 w-full rounded-[var(--radius-plot)] bg-brand font-semibold text-white">
          {t('apply')}
        </button>
      </noscript>
    </form>
  );
}
