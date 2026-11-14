'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PROPERTY_CATEGORIES, TELANGANA_DISTRICTS, type Locale, type PropertyPurpose } from '@onlineland/shared';
import { RENT_BUDGETS, SALE_BUDGETS } from '@/data/districts';
import { SearchIcon } from './icons';

/**
 * Search form. A plain GET form, so it also works before JavaScript loads.
 */
export function SearchPanel() {
  const t = useTranslations('search');
  const tl = useTranslations('listings');
  const locale = useLocale() as Locale;
  const [purpose, setPurpose] = useState<PropertyPurpose>('sale');
  const id = useId();

  const budgets = purpose === 'sale' ? SALE_BUDGETS : RENT_BUDGETS;
  const budgetKey = purpose === 'sale' ? 'budgetsSale' : 'budgetsRent';

  const field = 'block w-full h-12 rounded-[var(--radius-plot)] border border-line bg-paper px-3 text-[0.98rem] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
  const label = 'mb-1.5 block text-sm font-medium text-ink-soft';

  return (
    <form
      action={`/${locale}/properties`}
      method="get"
      role="search"
      aria-label={t('label')}
      className="rounded-[var(--radius-plot)] border border-line bg-paper p-4 shadow-[0_18px_40px_-24px_rgba(16,35,71,0.35)] sm:p-5"
    >
      <fieldset className="mb-4 inline-flex rounded-full bg-mist p-1">
        <legend className="sr-only">{t('label')}</legend>
        {(['sale', 'rent'] as const).map((p) => (
          <label
            key={p}
            className={`cursor-pointer rounded-full px-5 py-1.5 text-[0.95rem] font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
              purpose === p ? 'bg-brand text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <input
              type="radio"
              name="purpose"
              value={p}
              checked={purpose === p}
              onChange={() => setPurpose(p)}
              className="sr-only"
            />
            {p === 'sale' ? t('buy') : t('rent')}
          </label>
        ))}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.3fr_1fr]">
        <div>
          <label htmlFor={`${id}-type`} className={label}>
            {t('type')}
          </label>
          <select id={`${id}-type`} name="type" defaultValue="" className={field}>
            <option value="">{t('anyType')}</option>
            {PROPERTY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label[locale]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${id}-district`} className={label}>
            {t('location')}
          </label>
          <select id={`${id}-district`} name="district" defaultValue="" className={field}>
            <option value="">{tl('anyDistrict')}</option>
            {TELANGANA_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name[locale]}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor={`${id}-budget`} className={label}>
            {t('budget')}
          </label>
          <select key={purpose} id={`${id}-budget`} name="budget" defaultValue="" className={field}>
            <option value="">{t('anyBudget')}</option>
            {budgets.map((b) => (
              <option key={b} value={b}>
                {t(`${budgetKey}.${b}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-plot)] bg-brand px-6 text-base font-semibold text-white hover:bg-brand-deep"
      >
        <SearchIcon className="size-5" />
        {t('submit')}
      </button>
    </form>
  );
}
