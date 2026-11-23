'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, doc, limit, orderBy, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore';
import { youTubeThumb, youTubeWatch, type DealerPublic, type Property, type PropertyMedia, type PropertyPrivateContact, type PropertyStats, type UserProfile } from '@onlineland/shared';
import { Shell } from '@/components/Shell';
import { Badge, Button, Drawer, ErrorText, Field, KV, PageHeader, RowButton, StateBox, Tabs, TextArea } from '@/components/ui';
import { callFn, errorText, fb, storageUrl } from '@/lib/firebase';
import { categoryLabel, date, inr, isFuture, mobile10, toMs, tx } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useLiveDoc, useLiveQuery } from '@/lib/live';

type Status = 'pending' | 'approved' | 'rejected' | 'sold' | 'expired';
const STATUSES: Status[] = ['pending', 'approved', 'rejected', 'sold', 'expired'];
const DAY = 86_400_000;

export default function ListingsPage() {
  return (
    <Shell>
      <Suspense>
        <Listings />
      </Suspense>
    </Shell>
  );
}

function Listings() {
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const initial = (STATUSES as string[]).includes(params.get('status') ?? '') ? (params.get('status') as Status) : 'pending';
  const [status, setStatus] = useState<Status>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const list = useLiveQuery<Property>(
    () => query(collection(fb().db, 'properties'), where('status', '==', status), orderBy('createdAt', 'desc'), limit(100)),
    `listings-${status}`,
  );

  return (
    <>
      <PageHeader title={t('listings')} />
      <Tabs value={status} onChange={setStatus} options={STATUSES.map((s) => ({ id: s, label: s === 'pending' ? `${s} ⏳` : s }))} />
      <StateBox loading={list.loading} error={list.error} empty={!list.loading && list.rows.length === 0} />
      <div className="space-y-2">
        {list.rows.map(({ id, data: p }) => (
          <RowButton key={id} onClick={() => setOpen(id)} label={`${p.code ?? id} ${tx(p.title, locale)}`}>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{tx(p.title, locale) || '—'}</span>
              <span className="text-sm text-ink-soft">
                {p.code ?? '—'} · {categoryLabel(p.category, locale)} · {p.location?.mandal || p.location?.district}
              </span>
            </span>
            <span className="text-sm">{inr(p.price)}{p.priceBasis === 'per-unit' ? ` / ${p.areaUnit}` : ''}</span>
            <span className="text-sm text-ink-soft">{date(p.createdAt)}</span>
            <span className="flex gap-1">
              {p.isFeatured && <Badge value="active">★</Badge>}
              <Badge value={p.status}>{p.source}</Badge>
            </span>
          </RowButton>
        ))}
      </div>
      {open && <ListingDrawer id={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function ListingDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { t, locale } = useI18n();
  const prop = useLiveDoc<Property>(() => doc(fb().db, 'properties', id), `p-${id}`);
  const p = prop.data;
  const media = useLiveQuery<PropertyMedia>(() => query(collection(fb().db, 'properties', id, 'media'), orderBy('order')), `m-${id}`);
  const contact = useLiveDoc<PropertyPrivateContact>(() => doc(fb().db, 'properties', id, 'private', 'contact'), `c-${id}`);
  const stats = useLiveDoc<PropertyStats>(() => doc(fb().db, 'propertyStats', id), `s-${id}`);
  const ownerId = p?.ownerId ?? null;
  const owner = useLiveDoc<UserProfile>(ownerId ? () => doc(fb().db, 'users', ownerId) : null, `u-${ownerId}`);
  const dealer = useLiveDoc<DealerPublic>(ownerId ? () => doc(fb().db, 'dealers', ownerId) : null, `d-${ownerId}`);

  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const review = (decision: 'approve' | 'reject') =>
    run(async () => {
      await callFn('reviewProperty', { propertyId: id, decision, ...(decision === 'reject' ? { reason } : {}) });
      setRejecting(false);
    });
  const update = (data: Record<string, unknown>) => run(() => updateDoc(doc(fb().db, 'properties', id), { ...data, updatedAt: serverTimestamp() }));

  const featuredUntil = toMs(p?.featuredUntil);

  return (
    <Drawer title={p?.code ?? t('property')} onClose={onClose}>
      <StateBox loading={prop.loading} error={prop.error} />
      {p && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge value={p.status} />
            {p.isFeatured && <Badge value="active">★ {t('featured')}{featuredUntil ? ` → ${date(p.featuredUntil)}` : ''}</Badge>}
            {p.docsVerified && <Badge value="approved">{t('docsVerified')}</Badge>}
          </div>
          <div>
            <h3 className="text-lg font-bold">{tx(p.title, locale)}</h3>
            <p className="whitespace-pre-line text-sm text-ink-soft">{tx(p.description, locale)}</p>
          </div>

          {photosOf(media.rows).length > 0 && (
            <div className="grid grid-cols-3 gap-2" aria-label={t('photos')}>
              {photosOf(media.rows).map((m) => (
                // eslint-disable-next-line @next/next/no-img-element -- Storage URLs, static export
                <img key={m.id} src={storageUrl(m.data.storagePath) ?? ''} alt="" className="aspect-[4/3] w-full rounded object-cover" />
              ))}
            </div>
          )}
          {media.rows
            .filter((m) => m.data.type === 'video' || m.data.type === 'youtube')
            .map((m) =>
              m.data.type === 'video' ? (
                <video
                  key={m.id}
                  controls
                  preload="metadata"
                  poster={storageUrl(m.data.posterPath) ?? undefined}
                  src={storageUrl(m.data.storagePath) ?? undefined}
                  className="aspect-video w-full rounded bg-ink"
                  data-testid="admin-video"
                />
              ) : (
                <a
                  key={m.id}
                  href={youTubeWatch(m.data.youtubeId ?? '')}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded border border-line p-2 text-sm font-semibold text-brand"
                  data-testid="admin-youtube"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail */}
                  <img src={youTubeThumb(m.data.youtubeId ?? '')} alt="" className="h-16 w-28 rounded object-cover" />
                  ▶ YouTube ↗
                </a>
              ),
            )}

          <div>
            <KV label={t('price')}>{inr(p.price)}{p.priceBasis === 'per-unit' ? ` / ${p.areaUnit}` : p.priceBasis === 'per-month' ? ' / month' : ''}</KV>
            <KV label={t('area')}>{p.area} {p.areaUnit}</KV>
            <KV label={t('location')}>{[p.location.village, p.location.mandal, p.location.district].filter(Boolean).join(', ')}</KV>
            <KV label="Category">{categoryLabel(p.category, locale)} · {p.purpose}</KV>
            <KV label={t('date')}>{date(p.createdAt, true)}</KV>
            {stats.data && <KV label={t('stats')}>{stats.data.views ?? 0} / {stats.data.shares ?? 0} / {stats.data.leads ?? 0}</KV>}
            {p.listingPaidUntil && <KV label={t('kindListing')}>{date(p.listingPaidUntil)}</KV>}
          </div>

          <div className="rounded-md border border-line p-3">
            <h4 className="mb-1 font-bold">{t('owner')}</h4>
            <KV label="Name">{owner.data?.name || contact.data?.ownerName || '—'}</KV>
            <KV label={t('role')}>{owner.data?.role ?? p.source}</KV>
            <KV label={t('plan')}>
              {dealer.data && isFuture(dealer.data.validUntil) ? `${dealer.data.planId} → ${date(dealer.data.validUntil)}` : t('noPlan')}
              {dealer.data?.verified ? ' ✓' : ''}
            </KV>
            <KV label={t('ownerContact')}>
              {contact.data?.ownerPhone ? (
                <a className="text-brand underline" href={`tel:+91${mobile10(contact.data.ownerPhone)}`}>{contact.data.ownerPhone}</a>
              ) : (owner.data?.phone ?? '—')}
            </KV>
            {contact.data?.commissionTerms && <KV label="Commission">{contact.data.commissionTerms}</KV>}
          </div>

          <ErrorText>{error}</ErrorText>

          {p.status === 'pending' && !rejecting && (
            <div className="flex flex-wrap gap-2">
              <Button tone="field" disabled={busy} onClick={() => review('approve')}>{t('approve')}</Button>
              <Button tone="danger" disabled={busy} onClick={() => setRejecting(true)}>{t('reject')}</Button>
            </div>
          )}
          {rejecting && (
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
          {p.status === 'rejected' && p.rejectReason && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{p.rejectReason}</p>}

          {p.status === 'approved' && (
            <div className="flex flex-wrap gap-2">
              {p.isFeatured ? (
                <Button tone="quiet" disabled={busy} onClick={() => update({ isFeatured: false, featuredUntil: null })}>{t('unfeature')}</Button>
              ) : (
                <Button disabled={busy} onClick={() => update({ isFeatured: true, featuredUntil: Timestamp.fromMillis(Date.now() + 7 * DAY) })}>★ {t('featureWeek')}</Button>
              )}
              <Button tone="quiet" disabled={busy} onClick={() => update({ docsVerified: !p.docsVerified })}>
                {p.docsVerified ? '✓ ' : ''}{t('docsVerified')}
              </Button>
              <Button tone="quiet" disabled={busy} onClick={() => update({ status: p.purpose === 'rent' ? 'rented' : 'sold' })}>{t('markSold')}</Button>
              {p.code && (
                <a className="inline-flex min-h-10 items-center px-2 text-sm text-brand underline" target="_blank" rel="noreferrer" href={`https://onlineland.in/${locale}/properties/${p.code}`}>
                  onlineland.in ↗
                </a>
              )}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}

/** Photos only (media docs saved before videos existed have no type). */
const photosOf = <T extends { data: PropertyMedia }>(rows: T[]) => rows.filter((m) => (m.data.type ?? 'photo') === 'photo');
