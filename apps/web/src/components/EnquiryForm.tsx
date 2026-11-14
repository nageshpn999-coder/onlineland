'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@onlineland/shared';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export const inputClass =
  'block h-11 w-full rounded-[var(--radius-plot)] border border-line bg-paper px-3 text-[0.98rem] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-red-600';
export const labelClass = 'mb-1.5 block text-sm font-medium text-ink-soft';

export function EnquiryForm({ propertyId }: { propertyId: string }) {
  const t = useTranslations('enquiry');
  const locale = useLocale() as Locale;
  const id = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [phoneError, setPhoneError] = useState(false);

  if (status === 'sent') {
    return (
      <p role="status" className="rounded-[var(--radius-plot)] bg-field-soft p-4 font-medium text-field" data-testid="enquiry-sent">
        {t('sent')}
      </p>
    );
  }

  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const { createLead, normalizeMobile, MOBILE_RE } = await import('@/lib/leads');
        const phone = normalizeMobile(String(data.get('phone') ?? ''));
        if (!MOBILE_RE.test(phone)) {
          setPhoneError(true);
          return;
        }
        setPhoneError(false);
        setStatus('sending');
        try {
          await createLead({
            propertyId,
            channel: 'form',
            locale,
            name: String(data.get('name') ?? '').slice(0, 80),
            phone,
            message: String(data.get('message') ?? '').slice(0, 1000),
          });
          setStatus('sent');
        } catch (err) {
          console.error('[enquiry]', err);
          setStatus('error');
        }
      }}
    >
      <div>
        <label htmlFor={`${id}-name`} className={labelClass}>
          {t('name')}
        </label>
        <input id={`${id}-name`} name="name" autoComplete="name" maxLength={80} className={inputClass} />
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className={labelClass}>
          {t('phone')}
        </label>
        <input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          aria-invalid={phoneError}
          aria-describedby={phoneError ? `${id}-phone-error` : undefined}
          className={inputClass}
        />
        {phoneError && (
          <p id={`${id}-phone-error`} className="mt-1 text-sm text-red-700">
            {t('invalidPhone')}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-message`} className={labelClass}>
          {t('message')}
        </label>
        <textarea id={`${id}-message`} name="message" rows={3} maxLength={1000} className={`${inputClass} h-auto py-2`} />
      </div>
      {status === 'error' && (
        <p role="alert" className="text-sm text-red-700">
          {t('error')}
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="h-12 w-full rounded-[var(--radius-plot)] bg-brand font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
      >
        {status === 'sending' ? t('sending') : t('submit')}
      </button>
      <p className="text-xs text-ink-soft">{t('privacy')}</p>
    </form>
  );
}
