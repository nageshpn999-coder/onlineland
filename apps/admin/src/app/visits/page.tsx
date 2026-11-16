'use client';

import { useState } from 'react';
import { collection, doc, limit, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { SITE_VISIT_STATUSES, type Property, type SiteVisit, type SiteVisitStatus, type UserProfile } from '@onlineland/shared';
import { Shell } from '@/components/Shell';
import { Badge, Button, Drawer, ErrorText, Field, KV, PageHeader, RowButton, Select, StateBox, Tabs, TextArea } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { errorText, fb } from '@/lib/firebase';
import { date, mobile10, tx, waLink } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useLiveDoc, useLiveQuery } from '@/lib/live';

type Tab = 'all' | SiteVisitStatus;
const SLOT: Record<string, { te: string; en: string }> = {
  morning: { te: 'ఉదయం', en: 'Morning' },
  afternoon: { te: 'మధ్యాహ్నం', en: 'Afternoon' },
  evening: { te: 'సాయంత్రం', en: 'Evening' },
};

export default function VisitsPage() {
  return (
    <Shell adminOnly={false}>
      <Visits />
    </Shell>
  );
}

function Visits() {
  const { t, locale } = useI18n();
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const [tab, setTab] = useState<Tab>('requested');
  const [open, setOpen] = useState<string | null>(null);
  const uid = user?.uid ?? '';
  const list = useLiveQuery<SiteVisit>(
    () =>
      isAdmin
        ? query(collection(fb().db, 'siteVisits'), orderBy('createdAt', 'desc'), limit(300))
        : query(collection(fb().db, 'siteVisits'), where('agentId', '==', uid), orderBy('createdAt', 'desc'), limit(300)),
    isAdmin ? 'visits' : `visits-${uid}`,
  );
  const rows = list.rows.filter((r) => tab === 'all' || r.data.status === tab);

  return (
    <>
      <PageHeader title={t('visits')} />
      <Tabs value={tab} onChange={setTab} options={[{ id: 'all' as Tab, label: t('all') }, ...SITE_VISIT_STATUSES.map((s) => ({ id: s as Tab, label: s }))]} />
      <StateBox loading={list.loading} error={list.error} empty={!list.loading && rows.length === 0} />
      <div className="space-y-2">
        {rows.map(({ id, data: v }) => (
          <RowButton key={id} onClick={() => setOpen(id)} label={`${v.name} ${v.date}`}>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{v.name}</span>
              <span className="text-sm text-ink-soft">{v.phone}</span>
            </span>
            <span className="text-sm font-semibold">{v.date} · {SLOT[v.slot]?.[locale] ?? v.slot}</span>
            <span className="text-sm text-ink-soft">{date(v.createdAt)}</span>
            <Badge value={v.status} />
          </RowButton>
        ))}
      </div>
      {open && <VisitDrawer id={open} isAdmin={isAdmin} onClose={() => setOpen(null)} />}
    </>
  );
}

function VisitDrawer({ id, isAdmin, onClose }: { id: string; isAdmin: boolean; onClose: () => void }) {
  const { t, locale } = useI18n();
  const visit = useLiveDoc<SiteVisit>(() => doc(fb().db, 'siteVisits', id), `v-${id}`);
  const v = visit.data;
  const pid = v?.propertyId ?? null;
  const prop = useLiveDoc<Property>(pid ? () => doc(fb().db, 'properties', pid) : null, `vp-${pid}`);
  const agents = useLiveQuery<UserProfile>(isAdmin ? () => query(collection(fb().db, 'users'), where('role', '==', 'agent')) : null, 'agents');
  const [draft, setDraft] = useState<{ status: SiteVisitStatus; agent: string; notes: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const form = draft ?? (v ? { status: v.status, agent: v.agentId ?? '', notes: v.notes ?? '' } : null);

  async function save() {
    if (!form) return;
    setBusy(true);
    setError('');
    try {
      await updateDoc(doc(fb().db, 'siteVisits', id), {
        status: form.status,
        notes: form.notes.trim() || null,
        ...(isAdmin ? { agentId: form.agent || null } : {}),
        updatedAt: serverTimestamp(),
      });
      setDraft(null);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const title = prop.data ? `${prop.data.code ?? ''} ${tx(prop.data.title, locale)}`.trim() : (pid ?? '');
  return (
    <Drawer title={v?.name ?? t('visits')} onClose={onClose}>
      <StateBox loading={visit.loading} error={visit.error} />
      {v && form && (
        <>
          <div>
            <KV label={t('property')}>{title}</KV>
            <KV label={t('date')}>{v.date}</KV>
            <KV label={t('slot')}>{SLOT[v.slot]?.[locale] ?? v.slot}</KV>
            <KV label="Phone">{v.phone}</KV>
          </div>
          <div className="flex gap-2">
            <a className="inline-flex min-h-10 items-center rounded-md border border-line px-4 text-sm font-semibold" href={`tel:+91${mobile10(v.phone)}`}>📞 {t('call')}</a>
            <a className="inline-flex min-h-10 items-center rounded-md bg-[#1f8f4e] px-4 text-sm font-semibold text-white" target="_blank" rel="noreferrer"
              href={waLink(v.phone, `నమస్తే ${v.name}, ${v.date} న ${title} సైట్ విజిట్ — OnlineLand`)}>{t('whatsapp')}</a>
          </div>
          <Field label={t('status')}>
            <Select value={form.status} onChange={(e) => setDraft({ ...form, status: e.target.value as SiteVisitStatus })}>
              {SITE_VISIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          {isAdmin && (
            <Field label={t('assignAgent')}>
              <Select value={form.agent} onChange={(e) => setDraft({ ...form, agent: e.target.value })}>
                <option value="">{t('unassigned')}</option>
                {agents.rows.map((a) => <option key={a.id} value={a.id}>{a.data.name || a.data.phone || a.id}</option>)}
              </Select>
            </Field>
          )}
          <Field label={t('notes')}>
            <TextArea value={form.notes} onChange={(e) => setDraft({ ...form, notes: e.target.value })} maxLength={2000} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button disabled={busy || !draft} onClick={save}>{t('save')}</Button>
        </>
      )}
    </Drawer>
  );
}
