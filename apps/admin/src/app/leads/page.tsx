'use client';

import { useMemo, useState } from 'react';
import { collection, doc, limit, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { LEAD_STAGES, type DealerPublic, type Lead, type LeadStage, type Property, type UserProfile } from '@onlineland/shared';
import { Shell } from '@/components/Shell';
import { Badge, Button, Drawer, ErrorText, Field, Input, KV, PageHeader, RowButton, Select, StateBox, Tabs, TextArea } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { errorText, fb } from '@/lib/firebase';
import { date, mobile10, tx, waLink } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useLiveDoc, useLiveQuery } from '@/lib/live';

type StageTab = 'all' | LeadStage;
type Source = 'all' | 'dealer' | 'direct';

export default function LeadsPage() {
  return (
    <Shell adminOnly={false}>
      <Leads />
    </Shell>
  );
}

function Leads() {
  const { t } = useI18n();
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const [stage, setStage] = useState<StageTab>('new');
  const [source, setSource] = useState<Source>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const uid = user?.uid ?? '';
  const list = useLiveQuery<Lead>(
    () => {
      const base = collection(fb().db, 'leads');
      if (!isAdmin) return query(base, where('assignedAgentId', '==', uid), orderBy('createdAt', 'desc'), limit(200));
      if (stage === 'all') return query(base, orderBy('createdAt', 'desc'), limit(200));
      return query(base, where('stage', '==', stage), orderBy('createdAt', 'desc'), limit(200));
    },
    isAdmin ? `leads-${stage}` : `leads-agent-${uid}`,
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.rows.filter(({ data: l }) => {
      if (!isAdmin && stage !== 'all' && l.stage !== stage) return false;
      if (source === 'dealer' && !l.refId) return false;
      if (source === 'direct' && l.refId) return false;
      if (!needle) return true;
      return [l.name, l.phone, l.message].some((v) => v?.toLowerCase().includes(needle));
    });
  }, [list.rows, q, source, stage, isAdmin]);

  return (
    <>
      <PageHeader title={t('leads')}>
        <div className="flex flex-wrap gap-2">
          <Input aria-label={t('search')} placeholder={`${t('search')}…`} value={q} onChange={(e) => setQ(e.target.value)} className="w-48" />
          <Select aria-label="Source" value={source} onChange={(e) => setSource(e.target.value as Source)} className="w-44">
            <option value="all">{t('all')}</option>
            <option value="direct">{t('direct')}</option>
            <option value="dealer">{t('viaDealer')}</option>
          </Select>
        </div>
      </PageHeader>
      <Tabs value={stage} onChange={setStage} options={[{ id: 'all' as StageTab, label: t('all') }, ...LEAD_STAGES.map((s) => ({ id: s as StageTab, label: s }))]} />
      <StateBox loading={list.loading} error={list.error} empty={!list.loading && rows.length === 0} />
      <div className="space-y-2">
        {rows.map(({ id, data: l }) => (
          <RowButton key={id} onClick={() => setOpen(id)} label={`${l.name ?? ''} ${l.phone ?? ''}`}>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{l.name || l.phone || l.channel}</span>
              <span className="block truncate text-sm text-ink-soft">{l.message || '—'}</span>
            </span>
            <span className="text-sm">{l.phone ?? '—'} · {l.channel}</span>
            <span className="text-sm text-ink-soft">{date(l.createdAt, true)}</span>
            <span className="flex gap-1">
              {l.refId && <Badge value="confirmed">{t('viaDealer')}</Badge>}
              <Badge value={l.stage} />
            </span>
          </RowButton>
        ))}
      </div>
      {open && <LeadDrawer id={open} onClose={() => setOpen(null)} isAdmin={isAdmin} />}
    </>
  );
}

function LeadDrawer({ id, onClose, isAdmin }: { id: string; onClose: () => void; isAdmin: boolean }) {
  const { t, locale } = useI18n();
  const lead = useLiveDoc<Lead>(() => doc(fb().db, 'leads', id), `lead-${id}`);
  const l = lead.data;
  const pid = l?.propertyId ?? null;
  const prop = useLiveDoc<Property>(pid ? () => doc(fb().db, 'properties', pid) : null, `lp-${pid}`);
  const refId = l?.refId ?? null;
  const dealer = useLiveDoc<DealerPublic>(refId ? () => doc(fb().db, 'dealers', refId) : null, `ld-${refId}`);
  const agents = useLiveQuery<UserProfile>(isAdmin ? () => query(collection(fb().db, 'users'), where('role', '==', 'agent')) : null, 'agents');

  const [draft, setDraft] = useState<{ stage: LeadStage; notes: string; agent: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const form = draft ?? (l ? { stage: l.stage, notes: l.notes ?? '', agent: l.assignedAgentId ?? '' } : null);

  async function save() {
    if (!form) return;
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await updateDoc(doc(fb().db, 'leads', id), {
        stage: form.stage,
        notes: form.notes.trim() || null,
        ...(isAdmin ? { assignedAgentId: form.agent || null } : {}),
        updatedAt: serverTimestamp(),
      });
      setDraft(null);
      setSaved(true);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const phone = l?.phone ? mobile10(l.phone) : '';
  const title = prop.data ? `${prop.data.code ?? ''} ${tx(prop.data.title, locale)}`.trim() : '';

  return (
    <Drawer title={l?.name || l?.phone || t('leads')} onClose={onClose}>
      <StateBox loading={lead.loading} error={lead.error} />
      {l && form && (
        <>
          <div>
            <KV label="Phone">{l.phone ?? '—'}</KV>
            <KV label="Channel">{l.channel}</KV>
            <KV label={t('property')}>{title || l.propertyId || '—'}</KV>
            <KV label={t('date')}>{date(l.createdAt, true)}</KV>
            <KV label="Source">{l.refId ? `${t('viaDealer')}: ${dealer.data?.name || l.refId}` : t('direct')}</KV>
          </div>
          {l.message && <p className="rounded-md bg-mist p-3 text-sm">{l.message}</p>}
          {phone && (
            <div className="flex gap-2">
              <a className="inline-flex min-h-10 items-center rounded-md border border-line px-4 text-sm font-semibold" href={`tel:+91${phone}`}>📞 {t('call')}</a>
              <a
                className="inline-flex min-h-10 items-center rounded-md bg-[#1f8f4e] px-4 text-sm font-semibold text-white"
                target="_blank"
                rel="noreferrer"
                href={waLink(phone, `నమస్తే ${l.name ?? ''}, OnlineLand నుండి — ${title}`.trim())}
              >
                {t('whatsapp')}
              </a>
            </div>
          )}

          <Field label={t('stage')}>
            <Select value={form.stage} onChange={(e) => setDraft({ ...form, stage: e.target.value as LeadStage })}>
              {LEAD_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
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
            <TextArea value={form.notes} maxLength={2000} onChange={(e) => setDraft({ ...form, notes: e.target.value })} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <div className="flex items-center gap-3">
            <Button disabled={busy || !draft} onClick={save}>{t('save')}</Button>
            {saved && <span role="status" className="text-sm font-semibold text-field">{t('saved')} ✓</span>}
          </div>
        </>
      )}
    </Drawer>
  );
}
