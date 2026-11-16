import { getCategory, type Locale, type LocalizedText, type TimestampLike } from '@onlineland/shared';

export const tx = (v: LocalizedText | undefined | null, locale: Locale) =>
  v ? v[locale] || v[locale === 'te' ? 'en' : 'te'] || '' : '';

export function inr(n: number | null | undefined): string {
  if (typeof n !== 'number') return '—';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2).replace(/\.?0+$/, '')} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function toMs(v: unknown): number | null {
  if (!v) return null;
  if (typeof (v as TimestampLike).toMillis === 'function') return (v as TimestampLike).toMillis();
  return null;
}

export function date(v: unknown, withTime = false): string {
  const ms = toMs(v);
  if (ms === null) return '—';
  return new Date(ms).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export const categoryLabel = (id: string, locale: Locale) => getCategory(id)?.label[locale] ?? id;

/** 10-digit Indian number from "+91…" or plain digits. */
export const mobile10 = (p: string | null | undefined) => (p ? p.replace(/\D/g, '').slice(-10) : '');

export const waLink = (phone: string, text = '') =>
  `https://wa.me/91${mobile10(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** True when a timestamp is later than now (e.g. a plan still running). */
export const isFuture = (v: unknown) => (toMs(v) ?? 0) > Date.now();
