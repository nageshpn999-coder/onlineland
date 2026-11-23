'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { PLAN_IDS, SERVICE_IDS, type PlanConfig, type PlanId, type PricingSettings, type ServiceConfig, type ServiceId } from '@onlineland/shared';
import { Shell } from '@/components/Shell';
import { Button, ErrorText, Field, Input, PageHeader, Select, StateBox } from '@/components/ui';
import { useRevenueConfig } from '@/lib/config';
import { callFn, errorText, fb } from '@/lib/firebase';
import { useI18n, type Key } from '@/lib/i18n';

const PLAN_NUMBERS: { key: keyof PlanConfig; label: Key }[] = [
  { key: 'priceInr', label: 'planPrice' },
  { key: 'yearlyPriceInr', label: 'yearlyPriceInr' },
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
  const [services, setServices] = useState<Record<ServiceId, ServiceConfig> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  if (live.loading || live.error) return <StateBox loading={live.loading} error={live.error} />;
  const P = plans ?? live.plans;
  const R = pricing ?? live.pricing;
  const S = services ?? live.services;
  const setService = (id: ServiceId, patch: Partial<ServiceConfig>) => setServices({ ...S, [id]: { ...S[id], ...patch } });

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
        setDoc(doc(db, 'settings', 'services'), S),
      ]);
      setPlans(null);
      setPricing(null);
      setServices(null);
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
  const dirty = plans !== null || pricing !== null || services !== null;

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
            {PLAN_NUMBERS.filter((f) => id !== 'free' || !['priceInr', 'yearlyPriceInr', 'durationDays'].includes(f.key)).map((f) => (
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
        <Field label={t('dealCommissionPct')}>
          <Input type="number" min={0} max={10} step={0.25} inputMode="decimal" value={R.dealCommissionPct}
            onChange={(e) => setPricing({ ...R, dealCommissionPct: Math.min(10, Math.max(0, Number(e.target.value) || 0)) })} />
        </Field>
      </section>

      <h2 className="mb-3 text-lg font-bold">{t('launchOffer')}</h2>
      <section aria-label={t('launchOffer')} className="mb-8 grid gap-4 rounded-lg border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="size-5 accent-brand" checked={R.launchOfferActive} onChange={(e) => setPricing({ ...R, launchOfferActive: e.target.checked })} />
          {t('launchOfferActive')}
        </label>
        <Field label={t('launchOfferPlan')}>
          <Select value={R.launchOfferPlan} onChange={(e) => setPricing({ ...R, launchOfferPlan: e.target.value as 'basic' | 'pro' })}>
            <option value="basic">{P.basic.name[locale]}</option>
            <option value="pro">{P.pro.name[locale]}</option>
          </Select>
        </Field>
        <Field label={t('launchOfferDays')}>
          <Input type="number" min={1} inputMode="numeric" value={R.launchOfferDays} onChange={(e) => setPricing({ ...R, launchOfferDays: Math.max(1, num(e.target.value)) })} />
        </Field>
        <Field label={t('launchOfferDistricts')}>
          <Input value={R.launchOfferDistricts.join(', ')}
            onChange={(e) => setPricing({ ...R, launchOfferDistricts: e.target.value.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean) })} />
        </Field>
      </section>

      <h2 className="mb-3 text-lg font-bold">{t('servicePrices')}</h2>
      <p className="mb-3 text-sm text-ink-soft">{t('servicePriceHint')}</p>
      <section aria-label={t('servicePrices')} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_IDS.map((id) => (
          <div key={id} className="space-y-2 rounded-lg border border-line bg-white p-4">
            <h3 className="font-bold">{S[id].name[locale]}</h3>
            <Field label={t('quotePrice')}>
              <Input aria-label={`${S[id].name.en} price`} inputMode="numeric" value={S[id].priceInr ?? ''}
                onChange={(e) => setService(id, { priceInr: e.target.value.trim() === '' ? null : num(e.target.value) })} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-5 accent-brand" checked={S[id].active} onChange={(e) => setService(id, { active: e.target.checked })} />
              {t('active')}
            </label>
          </div>
        ))}
      </section>

      <Button tone="quiet" disabled={busy} onClick={runJob}>{t('runJob')}</Button>
    </>
  );
}
