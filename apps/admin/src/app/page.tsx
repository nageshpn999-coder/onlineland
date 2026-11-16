'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, Timestamp, where, type Query } from 'firebase/firestore';
import { Shell } from '@/components/Shell';
import { PageHeader } from '@/components/ui';
import { errorText, fb } from '@/lib/firebase';
import { useI18n, type Key } from '@/lib/i18n';

const CARDS: { key: Key; href: string; urgent: boolean; q: () => Query }[] = [
  { key: 'pendingListings', href: '/listings/', urgent: true, q: () => query(collection(fb().db, 'properties'), where('status', '==', 'pending')) },
  { key: 'pendingPayments', href: '/payments/', urgent: true, q: () => query(collection(fb().db, 'paymentRequests'), where('status', '==', 'pending')) },
  { key: 'newLeads', href: '/leads/', urgent: true, q: () => query(collection(fb().db, 'leads'), where('stage', '==', 'new')) },
  { key: 'requestedVisits', href: '/visits/', urgent: true, q: () => query(collection(fb().db, 'siteVisits'), where('status', '==', 'requested')) },
  { key: 'liveListings', href: '/listings/?status=approved', urgent: false, q: () => query(collection(fb().db, 'properties'), where('status', '==', 'approved')) },
  { key: 'activeDealers', href: '/users/', urgent: false, q: () => query(collection(fb().db, 'dealers'), where('validUntil', '>', Timestamp.now())) },
];

export default function Overview() {
  return (
    <Shell>
      <OverviewBody />
    </Shell>
  );
}

function OverviewBody() {
  const { t } = useI18n();
  const [counts, setCounts] = useState<(number | null)[]>(CARDS.map(() => null));
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all(CARDS.map((c) => getCountFromServer(c.q()).then((s) => s.data().count)))
      .then(setCounts)
      .catch((e) => setError(errorText(e)));
  }, []);

  return (
    <>
      <PageHeader title={t('overview')} />
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((c, i) => {
          const n = counts[i];
          const hot = c.urgent && (n ?? 0) > 0;
          return (
            <Link
              key={c.key}
              href={c.href}
              data-testid={`count-${c.key}`}
              className={`rounded-lg border bg-white p-5 hover:border-brand ${hot ? 'border-amber-400' : 'border-line'}`}
            >
              <p className="text-sm font-semibold text-ink-soft">{t(c.key)}</p>
              <p className={`font-display text-4xl font-bold ${hot ? 'text-amber-700' : 'text-ink'}`}>{n ?? '…'}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
