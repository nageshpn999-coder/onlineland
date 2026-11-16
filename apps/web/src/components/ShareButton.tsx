'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useDealerRef } from '@/lib/dealer-ref';
import { trackEvent } from '@/lib/track';
import { ShareIcon } from './icons';

/**
 * Share on WhatsApp (or the phone's share sheet). If the page was opened from a dealer's link,
 * the shared link keeps the dealer's ?ref so enquiries are still credited to them.
 */
export function ShareButton({ propertyId, code, title, price }: { propertyId: string; code: string; title: string; price: string }) {
  const t = useTranslations('property');
  const locale = useLocale();
  const { refId } = useDealerRef();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/${locale}/properties/${code}${refId ? `?ref=${encodeURIComponent(refId)}` : ''}`;
    const text = t('shareText', { title, price, code });
    trackEvent(propertyId, 'share');
    if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* cancelled: fall back to WhatsApp */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener');
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard not allowed */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      data-testid="share-button"
      className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 font-semibold text-ink hover:border-field hover:text-field"
    >
      <ShareIcon className="size-5" />
      {copied ? t('linkCopied') : t('share')}
    </button>
  );
}
