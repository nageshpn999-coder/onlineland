'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getCountFromServer, limit, orderBy, query, where } from 'firebase/firestore';
import { ROLES, type DealerPublic, type Role, type UserProfile } from '@onlineland/shared';
import { Shell } from '@/components/Shell';
import { Badge, Button, Drawer, ErrorText, Field, Input, KV, PageHeader, RowButton, Select, StateBox, Tabs } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { callFn, errorText, fb } from '@/lib/firebase';
import { date, isFuture, waLink } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useLiveDoc, useLiveQuery } from '@/lib/live';

type Tab = 'all' | Role;

export default function UsersPage() {
  return (
    <Shell>
      <Users />
    </Shell>
  );
}

function Users() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const list = useLiveQuery<UserProfile>(
    () =>
      tab === 'all'
        ? query(collection(fb().db, 'users'), orderBy('createdAt', 'desc'), limit(300))
        : query(collection(fb().db, 'users'), where('role', '==', tab), limit(300)),
    `users-${tab}`,
  );
  const dealers = useLiveQuery<DealerPublic>(() => collection(fb().db, 'dealers'), 'dealers-all');
  const byId = useMemo(() => new Map(dealers.rows.map((d) => [d.id, d.data])), [dealers.rows]);
  const rows = list.rows.filter(({ data: u }) => {
    const n = q.trim().toLowerCase();
    return !n || [u.name, u.phone, u.email].some((v) => v?.toLowerCase().includes(n));
  });

  return (
    <>
      <PageHeader title={t('users')}>
        <Input aria-label={t('search')} placeholder={`${t('search')}…`} value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
      </PageHeader>
      <Tabs value={tab} onChange={setTab} options={[{ id: 'all' as Tab, label: t('all') }, ...ROLES.map((r) => ({ id: r as Tab, label: r }))]} />
      <StateBox loading={list.loading} error={list.error} empty={!list.loading && rows.length === 0} />
      <div className="space-y-2">
        {rows.map(({ id, data: u }) => {
          const d = byId.get(id);
          const active = d && isFuture(d.validUntil);
          return (
            <RowButton key={id} onClick={() => setOpen(id)} label={`${u.name} ${u.phone ?? ''}`}>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{u.name || '—'} {d?.verified && <span className="text-field">✓</span>}</span>
                <span className="text-sm text-ink-soft">{u.phone ?? u.email ?? id}</span>
              </span>
              <span className="text-sm">{active ? `${d!.planId} → ${date(d!.validUntil)}` : t('noPlan')}</span>
              <span className="text-sm text-ink-soft">{date(u.createdAt)}</span>
              <Badge value={u.status === 'blocked' ? 'rejected' : undefined}>{u.role}</Badge>
            </RowButton>
          );
        })}
      </div>
      {open && <UserDrawer id={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function UserDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { t } = useI18n();
  const { user: me } = useAuth();
  const user = useLiveDoc<UserProfile>(() => doc(fb().db, 'users', id), `user-${id}`);
  const dealer = useLiveDoc<DealerPublic>(() => doc(fb().db, 'dealers', id), `dealer-${id}`);
  const [role, setRole] = useState<Role | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState<number | null>(null);
  const u = user.data;
  const d = dealer.data;

  useEffect(() => {
    getCountFromServer(query(collection(fb().db, 'properties'), where('ownerId', '==', id), where('status', '==', 'approved')))
      .then((s) => setLive(s.data().count))
      .catch(() => setLive(null));
  }, [id]);

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

  const planActive = d && isFuture(d.validUntil);
  return (
    <Drawer title={u?.name || u?.phone || t('users')} onClose={onClose}>
      <StateBox loading={user.loading} error={user.error} />
      {u && (
        <>
          <div>
            <KV label="Phone">{u.phone ?? '—'}</KV>
            <KV label={t('role')}>{u.role}</KV>
            <KV label={t('plan')}>{planActive ? `${d!.planId} → ${date(d!.validUntil)}` : t('noPlan')}</KV>
            {planActive && d!.featuredSlots > 0 && <KV label={t('featuredSlots')}>{d!.featuredUsed} / {d!.featuredSlots}</KV>}
            <KV label={t('liveListings')}>{live ?? '…'}</KV>
            <KV label={t('verified')}>{d?.verified ? '✓' : '—'}</KV>
            <KV label={t('date')}>{date(u.createdAt)}</KV>
          </div>
          {u.phone && (
            <a className="inline-flex min-h-10 items-center rounded-md bg-[#1f8f4e] px-4 text-sm font-semibold text-white" target="_blank" rel="noreferrer" href={waLink(u.phone)}>
              {t('whatsapp')}
            </a>
          )}
          <ErrorText>{error}</ErrorText>
          <div className="flex flex-wrap gap-2">
            {d?.verified ? (
              <Button tone="quiet" disabled={busy} onClick={() => run(() => callFn('setVerified', { uid: id, verified: false }))}>{t('removeBadge')}</Button>
            ) : (
              <Button tone="field" disabled={busy} onClick={() => run(() => callFn('setVerified', { uid: id, verified: true }))}>{t('giveBadge')}</Button>
            )}
          </div>
          <div className="flex items-end gap-2">
            <Field label={t('changeRole')}>
              <Select value={role || u.role} onChange={(e) => setRole(e.target.value as Role)} disabled={id === me?.uid}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>
            <Button disabled={busy || !role || role === u.role} onClick={() => run(async () => { await callFn('setUserRole', { uid: id, role }); setRole(''); })}>
              {t('save')}
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
