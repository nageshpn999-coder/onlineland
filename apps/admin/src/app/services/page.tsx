'use client';

import { useState } from 'react';
import { collection, doc, limit, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { SERVICE_STATUSES, type Property, type ServiceRequest, type ServiceStatus } from '@onlineland/shared';
import { Shell } from '@/components/Shell';
import { Badge, Button, Drawer, ErrorText, Field, Input, KV, PageHeader, RowButton, Select, StateBox, Tabs, TextArea } from '@/components/ui';
import { useRevenueConfig } from '@/lib/config';
import { callFn, errorText, fb } from '@/lib/firebase';
import { date, inr, mobile10, tx, waLink } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useLiveDoc, useLiveQuery } from '@/lib/live';

export default function ServicesPage() {
  return (
    <Shell>
      <Services />
    </Shell>
  );
}

function Services() {
  const { t, locale } = useI18n();
  const { services } = useRevenueConfig();
  const [status, setStatus] = useState<ServiceStatus>('new');
  const [open, setOpen] = useState<string | null>(null);
  const list = useLiveQuery<ServiceRequest>(
    () => query(collection(fb().db, 'serviceRequests'), where('status', '==', status), orderBy('createdAt', 'desc'), limit(200)),
    `svc-${status}`,
  );
  return (
    <>
      <PageHeader title={t('services')} />
      <Tabs value={status} onChange={setStatus} options={SERVICE_STATUSES.map((s) => ({ id: s, label: s }))} />
      <StateBox loading={list.loading} error={list.error} empty={!list.loading && list.rows.length === 0} />
      <div className="space-y-2">
        {list.rows.map(({ id, data: r }) => (
          <RowButton key={id} onClick={() => setOpen(id)} label={`${r.name} ${r.phone}`}>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{services[r.serviceId]?.name[locale] ?? r.serviceId}</span>
              <span className="block truncate text-sm text-ink-soft">{r.name} · {r.phone}</span>
            </span>
            <span className="font-display text-lg font-bold">{r.quotedInr != null ? inr(r.quotedInr) : '—'}</span>
            <span className="text-sm text-ink-soft">{date(r.createdAt, true)}</span>
            <Badge value={r.status} />
          </RowButton>
        ))}
      </div>
      {open && <ServiceDrawer id={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function ServiceDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { t, locale } = useI18n();
  const { services } = useRevenueConfig();
  const req = useLiveDoc<ServiceRequest>(() => doc(fb().db, 'serviceRequests', id), `svc-${id}`);
  const r = req.data;
  const pid = r?.propertyId ?? null;
  const prop = useLiveDoc<Property>(pid ? () => doc(fb().db, 'properties', pid) : null, `sp-${pid}`);
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [next, setNext] = useState<ServiceStatus | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await fn();
      setMsg(t('saved'));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const quote = () => act(async () => {
    await callFn('quoteService', { requestId: id, amountInr: Math.round(Number(price)), note: note.trim() || null });
    setPrice('');
  });
  const move = () => act(async () => {
    if (!next) return;
    await updateDoc(doc(fb().db, 'serviceRequests', id), { status: next, updatedAt: serverTimestamp() });
    setNext('');
  });

  const svc = r ? services[r.serviceId] : null;
  const phone = r?.phone ? mobile10(r.phone) : '';
  const title = prop.data ? `${prop.data.code ?? ''} ${tx(prop.data.title, locale)}`.trim() : '';

  return (
    <Drawer title={svc?.name[locale] ?? t('service')} onClose={onClose}>
      <StateBox loading={req.loading} error={req.error} />
      {r && (
        <>
          <div>
            <KV label={t('status')}><Badge value={r.status} /></KV>
            <KV label="Name">{r.name}</KV>
            <KV label="Phone">{r.phone}</KV>
            <KV label={t('property')}>{title || r.propertyId || '—'}</KV>
            <KV label={t('quoted')}>{r.quotedInr != null ? inr(r.quotedInr) : svc?.priceInr === 0 ? t('free') : '—'}</KV>
            <KV label={t('date')}>{date(r.createdAt, true)}</KV>
          </div>
          {r.note && <p className="rounded-md bg-mist p-3 text-sm">{r.note}</p>}
          {phone && (
            <div className="flex gap-2">
              <a className="inline-flex min-h-10 items-center rounded-md border border-line px-4 text-sm font-semibold" href={`tel:+91${phone}`}>📞 {t('call')}</a>
              <a className="inline-flex min-h-10 items-center rounded-md bg-[#1f8f4e] px-4 text-sm font-semibold text-white" target="_blank" rel="noreferrer"
                href={waLink(phone, `నమస్తే ${r.name}, OnlineLand నుండి — ${svc?.name.te ?? ''}`.trim())}>
                {t('whatsapp')}
              </a>
            </div>
          )}

          {(r.status === 'new' || r.status === 'quoted') && (
            <section aria-label={t('sendQuote')} className="space-y-2 rounded-md border border-line p-3">
              <Field label={t('quotePrice')}>
                <Input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} />
              </Field>
              <Field label={t('quoteNote')}>
                <TextArea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <Button disabled={busy || !(Number(price) >= 1)} onClick={quote}>{t('sendQuote')}</Button>
            </section>
          )}

          <div className="flex items-end gap-2">
            <Field label={t('status')}>
              <Select value={next} onChange={(e) => setNext(e.target.value as ServiceStatus)}>
                <option value="">—</option>
                {SERVICE_STATUSES.filter((s) => s !== r.status && s !== 'quoted').map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Button tone="quiet" disabled={busy || !next} onClick={move}>{t('save')}</Button>
          </div>
          <ErrorText>{error}</ErrorText>
          {msg && <p role="status" className="text-sm font-semibold text-field">{msg} ✓</p>}
        </>
      )}
    </Drawer>
  );
}
