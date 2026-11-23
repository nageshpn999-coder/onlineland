'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale, ServiceId } from '@onlineland/shared';
import { inputClass, labelClass } from './EnquiryForm';
import { Honeypot, isBot } from './Honeypot';

type Status = 'closed' | 'open' | 'sending' | 'sent' | 'error';

/** "Ask" button that opens a short form (name, mobile, note) and records a service request. */
export function ServiceAsk({ serviceId, propertyId = null, label }: { serviceId: ServiceId; propertyId?: string | null; label?: string }) {
  const t = useTranslations('services');
  const te = useTranslations('enquiry');
  const locale = useLocale() as Locale;
  const id = useId();
  const [status, setStatus] = useState<Status>('closed');
  const [phoneError, setPhoneError] = useState(false);

  if (status === 'sent') {
    return (
      <p role="status" data-testid="service-sent" className="mt-3 rounded-[var(--radius-plot)] bg-field-soft p-3 text-sm font-medium text-field">
        {t('sent')}
      </p>
    );
  }
  if (status === 'closed') {
    return (
      <button
        type="button"
        data-testid={`service-ask-${serviceId}`}
        onClick={() => setStatus('open')}
        className="mt-3 inline-flex h-10 items-center rounded-[var(--radius-plot)] border border-brand px-4 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
      >
        {label ?? t('ask')}
      </button>
    );
  }

  return (
    <form
      noValidate
      data-testid={`service-form-${serviceId}`}
      className="mt-3 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        if (isBot(data)) {
          setStatus('sent');
          return;
        }
        const { normalizeMobile, MOBILE_RE } = await import('@/lib/phone');
        const phone = normalizeMobile(String(data.get('phone') ?? ''));
        const name = String(data.get('name') ?? '').trim();
        if (!MOBILE_RE.test(phone)) {
          setPhoneError(true);
          return;
        }
        setPhoneError(false);
        setStatus('sending');
        try {
          const { createServiceRequest } = await import('@/lib/services');
          await createServiceRequest({ serviceId, propertyId, name: name || '—', phone, note: String(data.get('note') ?? ''), locale });
          setStatus('sent');
        } catch (err) {
          console.error('[service]', err);
          setStatus('error');
        }
      }}
    >
      <div>
        <label htmlFor={`${id}-name`} className={labelClass}>{te('name')}</label>
        <input id={`${id}-name`} name="name" autoComplete="name" maxLength={80} className={inputClass} />
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className={labelClass}>{te('phone')}</label>
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
        {phoneError && <p id={`${id}-phone-error`} className="mt-1 text-sm text-red-700">{te('invalidPhone')}</p>}
      </div>
      <div>
        <label htmlFor={`${id}-note`} className={labelClass}>{t('note')}</label>
        <textarea id={`${id}-note`} name="note" rows={2} maxLength={500} className={`${inputClass} h-auto py-2`} />
      </div>
      {status === 'error' && <p role="alert" className="text-sm text-red-700">{te('error')}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="h-11 flex-1 rounded-[var(--radius-plot)] bg-brand px-4 font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
        >
          {status === 'sending' ? te('sending') : t('send')}
        </button>
        <button type="button" onClick={() => setStatus('closed')} className="h-11 rounded-[var(--radius-plot)] border border-line px-4 text-sm font-semibold text-ink-soft">
          {t('cancel')}
        </button>
      </div>
      <Honeypot />
    </form>
  );
}
