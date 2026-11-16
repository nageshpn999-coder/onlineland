'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { PLAN_IDS, type PlanConfig, type PlanId, type PricingSettings } from '@onlineland/shared';
import { Shell } from '@/components/Shell';
import { Button, ErrorText, Field, Input, PageHeader, StateBox } from '@/components/ui';
import { useRevenueConfig } from '@/lib/config';
import { callFn, errorText, fb } from '@/lib/firebase';
import { useI18n, type Key } from '@/lib/i18n';

const PLAN_NUMBERS: { key: keyof PlanConfig; label: Key }[] = [
  { key: 'priceInr', label: 'planPrice' },
  { key: 'durationDays', label: 'durationDays' },
  { key: 'listingLimit', label: 'listingLimit' },
  { key: 'featuredSlots', label: 'featuredSlots' },
];
const PLAN_FLAGS: { key: keyof PlanConfig; label: Key }[] = [
  { key: 'ownContact', label: 'ownContact' },
  { key: 'dealerPage', label: 'dealerPage' },
  { key: 'areaLeads', label: 'areaLeads' },
];
const PRICE_NUMBERS: (keyof PricingSettings & Key)[] = [
  'featuredWeekInr', 'featuredDays', 'ownerFreeListings', 'ownerListingInr', 'ownerListingDays', 'renewalReminderDays',
];

export default function SettingsPage() {
  return (
    <Shell>
      <Settings />
    </Shell>
  );
}

function Settings() {
  const { t, locale } = useI18n();
  const live = useRevenueConfig();
  const [plans, setPlans] = useState<Record<PlanId, PlanConfig> | null>(null);
  const [pricing, setPricing] = useState<PricingSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  if (live.loading || live.error) return <StateBox loading={live.loading} error={live.error} />;
  const P = plans ?? live.plans;
  const R = pricing ?? live.pricing;

  const setPlan = (id: PlanId, key: keyof PlanConfig, value: number | boolean) => setPlans({ ...P, [id]: { ...P[id], [key]: value } });

  async function save() {
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const { db } = fb();
      await Promise.all([
        ...PLAN_IDS.map((id) => setDoc(doc(db, 'plans', id), P[id])),
        setDoc(doc(db, 'settings', 'pricing'), R),
      ]);
      setPlans(null);
      setPricing(null);
      setMsg(t('saved'));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function runJob() {
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const r = await callFn<{ reminded: number; unfeatured: number; expired: number }>('runMaintenance', {});
      setMsg(`${t('jobDone')}: ${r.reminded} reminders, ${r.unfeatured} unfeatured, ${r.expired} expired`);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const num = (v: string) => Math.max(0, Math.round(Number(v) || 0));
  const dirty = plans !== null || pricing !== null;

  return (
    <>
      <PageHeader title={t('settings')}>
        <div className="flex items-center gap-3">
          {msg && <span role="status" className="text-sm font-semibold text-field">{msg}</span>}
          <Button disabled={busy || !dirty} onClick={save}>{t('save')}</Button>
        </div>
      </PageHeader>
      <ErrorText>{error}</ErrorText>

      <h2 className="mb-3 text-lg font-bold">{t('plans')}</h2>
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {PLAN_IDS.map((id) => (
          <section key={id} aria-label={P[id].name.en} className="space-y-3 rounded-lg border border-line bg-white p-4">
            <h3 className="text-xl font-bold">{P[id].name[locale]}</h3>
            {PLAN_NUMBERS.filter((f) => id !== 'free' || (f.key !== 'priceInr' && f.key !== 'durationDays')).map((f) => (
              <Field key={f.key} label={t(f.label)}>
                <Input type="number" min={0} inputMode="numeric" value={P[id][f.key] as number} onChange={(e) => setPlan(id, f.key, num(e.target.value))} />
              </Field>
            ))}
            {PLAN_FLAGS.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-5 accent-brand" checked={P[id][f.key] as boolean} onChange={(e) => setPlan(id, f.key, e.target.checked)} />
                {t(f.label)}
              </label>
            ))}
          </section>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold">{t('pricing')}</h2>
      <section className="mb-8 grid gap-4 rounded-lg border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRICE_NUMBERS.map((k) => (
          <Field key={k} label={t(k)}>
            <Input type="number" min={0} inputMode="numeric" value={R[k] as number} onChange={(e) => setPricing({ ...R, [k]: num(e.target.value) })} />
          </Field>
        ))}
        <Field label={t('upiId')} hint="example@okaxis">
          <Input value={R.upiId} onChange={(e) => setPricing({ ...R, upiId: e.target.value.trim() })} />
        </Field>
        <Field label={t('upiName')}>
          <Input value={R.upiName} onChange={(e) => setPricing({ ...R, upiName: e.target.value })} />
        </Field>
      </section>

      <Button tone="quiet" disabled={busy} onClick={runJob}>{t('runJob')}</Button>
    </>
  );
}
