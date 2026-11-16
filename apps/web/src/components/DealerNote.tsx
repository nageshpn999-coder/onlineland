'use client';

import { useTranslations } from 'next-intl';
import { useDealerRef } from '@/lib/dealer-ref';

/** "Listed by Ravi Properties ✓" — shown only on a paid dealer's own share link. */
export function DealerNote() {
  const t = useTranslations('property');
  const { dealer } = useDealerRef();
  if (!dealer) return null;
  return (
    <p className="mb-4 rounded-[var(--radius-plot)] bg-field-soft px-3 py-2 text-sm text-field" data-testid="dealer-note">
      {t('listedBy', { name: dealer.name })}
      {dealer.verified && <span className="ml-1 font-semibold">✓ {t('verifiedDealer')}</span>}
    </p>
  );
}

/** "Your enquiry goes to OnlineLand" — or to the dealer and OnlineLand on a paid dealer's link. */
export function ContactNote() {
  const t = useTranslations('property');
  const { dealer } = useDealerRef();
  return <p className="mb-4 mt-1 text-sm text-ink-soft">{dealer ? t('contactNoteDealer', { name: dealer.name }) : t('contactNote')}</p>;
}
