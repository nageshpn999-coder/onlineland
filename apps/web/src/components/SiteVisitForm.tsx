'use client';

import { useId, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@onlineland/shared';
import { inputClass, labelClass } from './EnquiryForm';

type Status = 'idle' | 'sending' | 'sent' | 'error';
const SLOTS = ['morning', 'afternoon', 'evening'] as const;

/** YYYY-MM-DD in India time, offset by `days`. */
function istDate(days: number): string {
  const d = new Date(Date.now() + 5.5 * 3600_000 + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export function SiteVisitForm({ propertyId }: { propertyId: string }) {
  const t = useTranslations('visit');
  const te = useTranslations('enquiry');
  const locale = useLocale() as Locale;
  const id = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean; date?: boolean }>({});
  const { min, max } = useMemo(() => ({ min: istDate(1), max: istDate(60) }), []);

  if (status === 'sent') {
    return (
      <p role="status" className="rounded-[var(--radius-plot)] bg-field-soft p-4 font-medium text-field" data-testid="visit-sent">
        {t('sent')}
      </p>
    );
  }

  return (
    <form
      noValidate
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const { createSiteVisit, normalizeMobile, MOBILE_RE } = await import('@/lib/leads');
        const name = String(data.get('name') ?? '').trim().slice(0, 80);
        const phone = normalizeMobile(String(data.get('phone') ?? ''));
        const date = String(data.get('date') ?? '');
        const slot = String(data.get('slot') ?? 'morning') as (typeof SLOTS)[number];
        const next = { name: !name, phone: !MOBILE_RE.test(phone), date: !(date >= min && date <= max) };
        setErrors(next);
        if (next.name || next.phone || next.date) return;
        setStatus('sending');
        try {
          await createSiteVisit({ propertyId, name, phone, date, slot, locale });
          setStatus('sent');
        } catch (err) {
          console.error('[site visit]', err);
          setStatus('error');
        }
      }}
    >
      <div>
        <label htmlFor={`${id}-name`} className={labelClass}>
          {t('name')}
        </label>
        <input id={`${id}-name`} name="name" autoComplete="name" maxLength={80} aria-invalid={!!errors.name} className={inputClass} />
        {errors.name && <p className="mt-1 text-sm text-red-700">{t('nameRequired')}</p>}
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className={labelClass}>
          {t('phone')}
        </label>
        <input id={`${id}-phone`} name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" aria-invalid={!!errors.phone} className={inputClass} />
        {errors.phone && <p className="mt-1 text-sm text-red-700">{te('invalidPhone')}</p>}
      </div>
      <div>
        <label htmlFor={`${id}-date`} className={labelClass}>
          {t('date')}
        </label>
        <input id={`${id}-date`} name="date" type="date" min={min} max={max} defaultValue={min} aria-invalid={!!errors.date} className={inputClass} />
        {errors.date && <p className="mt-1 text-sm text-red-700">{t('invalidDate')}</p>}
      </div>
      <fieldset>
        <legend className={labelClass}>{t('slot')}</legend>
        <div className="flex flex-wrap gap-2">
          {SLOTS.map((s, i) => (
            <label
              key={s}
              className="cursor-pointer rounded-full border border-line px-3 py-2 text-sm text-ink has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
            >
              <input type="radio" name="slot" value={s} defaultChecked={i === 0} className="sr-only" />
              {t(`slots.${s}`)}
            </label>
          ))}
        </div>
      </fieldset>
      {status === 'error' && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {te('error')}
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="h-12 rounded-[var(--radius-plot)] bg-ink font-semibold text-white hover:bg-[#0b1a36] disabled:opacity-60 sm:col-span-2"
      >
        {status === 'sending' ? t('sending') : t('submit')}
      </button>
    </form>
  );
}
