'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { LeadChannel, Locale } from '@onlineland/shared';
import { PHONE_TEL, whatsappLink } from '@/lib/whatsapp';
import { ChatIcon, PhoneIcon } from './icons';

/** Records a WhatsApp/call click as a lead for the CRM. Never blocks or breaks the click itself. */
function logClick(propertyId: string, channel: LeadChannel, locale: Locale) {
  import('@/lib/leads')
    .then(({ createLead }) => createLead({ propertyId, channel, locale }))
    .catch((err) => console.warn('[lead] click not recorded:', err?.message));
}

type Props = { propertyId: string; code: string; title: string; variant?: 'stacked' | 'bar' };

export function ContactActions({ propertyId, code, title, variant = 'stacked' }: Props) {
  const t = useTranslations('property');
  const locale = useLocale() as Locale;
  const wa = whatsappLink(t('whatsappMessage', { code, title }));

  const waClass = 'inline-flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-field px-5 font-semibold text-white hover:bg-[#0b5532]';
  const callClass = 'inline-flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-brand px-5 font-semibold text-brand hover:bg-brand hover:text-white';

  const buttons = (
    <>
      <a href={wa} target="_blank" rel="noopener" className={waClass} onClick={() => logClick(propertyId, 'whatsapp', locale)} data-testid="whatsapp-link">
        <ChatIcon className="size-5" />
        {t('whatsapp')}
      </a>
      <a href={PHONE_TEL} className={callClass} onClick={() => logClick(propertyId, 'call', locale)}>
        <PhoneIcon className="size-5" />
        {t('call')}
      </a>
    </>
  );

  if (variant === 'bar') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line bg-paper/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {buttons}
      </div>
    );
  }
  return <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">{buttons}</div>;
}
