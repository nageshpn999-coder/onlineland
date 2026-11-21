'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { NEAR_RADII_KM, inTelanganaArea, roundCoord } from '@onlineland/shared';
import { useRouter } from '@/i18n/navigation';
import { filtersToQuery, type ListingFilters } from '@/lib/listing-filters';

/**
 * "📍 Near me": asks the browser for the visitor's location once, rounds it to ~1 km and lists
 * properties nearest first. The location is only put in this page's address; it is not saved.
 */
export function NearMe({ filters }: { filters: ListingFilters }) {
  const t = useTranslations('listings');
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'locating' | 'denied' | 'outside'>('idle');

  const go = (overrides: Parameters<typeof filtersToQuery>[1]) =>
    router.push({ pathname: '/properties', query: filtersToQuery(filters, { page: null, ...overrides }) });

  function locate() {
    if (!('geolocation' in navigator)) return setState('denied');
    setState('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: roundCoord(pos.coords.latitude), lng: roundCoord(pos.coords.longitude) };
        if (!inTelanganaArea(p)) return setState('outside');
        setState('idle');
        // Near me looks across Telangana, so district/mandal filters are cleared.
        go({ near: `${p.lat},${p.lng}`, sort: null, district: null, mandal: null });
      },
      () => setState('denied'),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 300_000 },
    );
  }

  if (!filters.near) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={locate}
          disabled={state === 'locating'}
          data-testid="near-me"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-field px-4 text-sm font-semibold text-field hover:bg-field-soft disabled:opacity-60"
        >
          <span aria-hidden>📍</span>
          {state === 'locating' ? t('locating') : t('nearMe')}
        </button>
        {state === 'denied' && <span role="status" className="text-sm text-ink-soft">{t('locationDenied')}</span>}
        {state === 'outside' && <span role="status" className="text-sm text-ink-soft">{t('locationOutside')}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="near-active">
      <span className="text-sm font-semibold text-field">📍 {t('nearActive')}</span>
      <label className="sr-only" htmlFor="near-radius">
        {t('radius')}
      </label>
      <select
        id="near-radius"
        value={filters.radius ?? ''}
        onChange={(e) => go({ radius: e.target.value || null })}
        className="h-10 rounded-[var(--radius-plot)] border border-line bg-paper px-2 text-sm text-ink"
      >
        <option value="">{t('radiusAny')}</option>
        {NEAR_RADII_KM.map((r) => (
          <option key={r} value={r}>
            {t('radiusKm', { km: r })}
          </option>
        ))}
      </select>
      <button type="button" onClick={() => go({ near: null, radius: null, sort: null })} className="h-10 px-2 text-sm font-medium text-brand hover:underline">
        {t('nearOff')}
      </button>
    </div>
  );
}
