'use client';

import { useState } from 'react';
import { collection, doc, limit, orderBy, query, where } from 'firebase/firestore';
import { paymentAmount, type PaymentRequest, type PaymentStatus, type Property, type UserProfile } from '@onlineland/shared';
import { Shell } from '@/components/Shell';
import { Badge, Button, Drawer, ErrorText, Field, KV, PageHeader, RowButton, StateBox, Tabs, TextArea } from '@/components/ui';
import { useRevenueConfig } from '@/lib/config';
import { callFn, errorText, fb } from '@/lib/firebase';
import { date, inr, tx } from '@/lib/format';
import { useI18n, type Key } from '@/lib/i18n';
import { useLiveDoc, useLiveQuery } from '@/lib/live';

const KIND: Record<string, Key> = { plan: 'kindPlan', featured: 'kindFeatured', listing: 'kindListing' };

export default function PaymentsPage() {
  return (
    <Shell>
      <Payments />
    </Shell>
  );
}

function Payments() {
  const { t } = useI18n();
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [open, setOpen] = useState<string | null>(null);
  const list = useLiveQuery<PaymentRequest>(
    () => query(collection(fb().db, 'paymentRequests'), where('status', '==', status), orderBy('createdAt', 'desc'), limit(200)),
    `pay-${status}`,
  );
  return (
    <>
      <PageHeader title={t('payments')} />
      <Tabs value={status} onChange={setStatus} options={(['pending', 'approved', 'rejected'] as PaymentStatus[]).map((s) => ({ id: s, label: s }))} />
      <StateBox loading={list.loading} error={list.error} empty={!list.loading && list.rows.length === 0} />
      <div className="space-y-2">
        {list.rows.map(({ id, data: p }) => (
          <RowButton key={id} onClick={() => setOpen(id)} label={`UTR ${p.utr}`}>
            <span className="min-w-0">
              <span className="block font-semibold">{t(KIND[p.kind] ?? 'kindPlan')}{p.planId ? ` · ${p.planId}` : ''}</span>
              <span className="font-mono text-sm text-ink-soft">UTR {p.utr}</span>
            </span>
            <span className="font-display text-lg font-bold">{inr(p.amountInr)}</span>
            <span className="text-sm text-ink-soft">{date(p.createdAt, true)}</span>
            <Badge value={p.status} />
          </RowButton>
        ))}
      </div>
      {open && <PaymentDrawer id={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function PaymentDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { t, locale } = useI18n();
  const pay = useLiveDoc<PaymentRequest>(() => doc(fb().db, 'paymentRequests', id), `pay-${id}`);
  const p = pay.data;
  const uid = p?.userId ?? null;
  const user = useLiveDoc<UserProfile>(uid ? () => doc(fb().db, 'users', uid) : null, `pu-${uid}`);
  const pid = p?.propertyId ?? null;
  const prop = useLiveDoc<Property>(pid ? () => doc(fb().db, 'properties', pid) : null, `pp-${pid}`);
  const { plans, pricing } = useRevenueConfig();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function review(decision: 'approve' | 'reject') {
    setBusy(true);
    setError('');
    try {
      await callFn('reviewPayment', { paymentId: id, decision, ...(decision === 'reject' ? { reason } : {}) });
      setRejecting(false);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const expected = p ? paymentAmount(p.kind, p.planId, plans, pricing) : 0;
  const short = p ? p.amountInr < expected : false;

  return (
    <Drawer title={`UTR ${p?.utr ?? ''}`} onClose={onClose}>
      <StateBox loading={pay.loading} error={pay.error} />
      {p && (
        <>
          <div>
            <KV label={t('status')}><Badge value={p.status} /></KV>
            <KV label={t('kind')}>{t(KIND[p.kind] ?? 'kindPlan')}{p.planId ? ` — ${plans[p.planId].name[locale]}` : ''}</KV>
            {prop.data && <KV label={t('property')}>{prop.data.code ?? pid} {tx(prop.data.title, locale)}</KV>}
            <KV label={t('amount')}><span className={short ? 'text-red-700' : ''}>{inr(p.amountInr)}</span></KV>
            <KV label={t('expected')}>{inr(expected)}</KV>
            <KV label={t('utr')}><span className="font-mono">{p.utr}</span></KV>
            <KV label={t('date')}>{date(p.createdAt, true)}</KV>
            <KV label="User">{user.data?.name || '—'} · {user.data?.phone ?? uid}</KV>
            <KV label={t('role')}>{user.data?.role ?? '—'}</KV>
          </div>
          {p.status === 'rejected' && p.rejectReason && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{p.rejectReason}</p>}
          {p.status === 'pending' && (
            <>
              <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{t('checkBank')}</p>
              <ErrorText>{error}</ErrorText>
              {!rejecting ? (
                <div className="flex gap-2">
                  <Button tone="field" disabled={busy || short} onClick={() => review('approve')}>{t('approve')}</Button>
                  <Button tone="danger" disabled={busy} onClick={() => setRejecting(true)}>{t('reject')}</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Field label={t('rejectReason')}>
                    <TextArea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
                  </Field>
                  <div className="flex gap-2">
                    <Button tone="danger" disabled={busy || reason.trim().length < 3} onClick={() => review('reject')}>{t('reject')}</Button>
                    <Button tone="quiet" onClick={() => setRejecting(false)}>{t('cancel')}</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </Drawer>
  );
}
