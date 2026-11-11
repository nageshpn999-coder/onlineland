import type { Locale } from '@onlineland/shared';

const LAKH = 100_000;
const CRORE = 10_000_000;

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

/** Formats rupees the Indian way: ₹16 lakh / ₹1.2 crore / ₹8,000. */
export function formatPrice(rupees: number, locale: Locale): string {
  if (rupees >= CRORE) {
    return locale === 'te' ? `₹${trim(rupees / CRORE)} కోట్లు` : `₹${trim(rupees / CRORE)} crore`;
  }
  if (rupees >= LAKH) {
    return locale === 'te' ? `₹${trim(rupees / LAKH)} లక్షలు` : `₹${trim(rupees / LAKH)} lakh`;
  }
  return `₹${rupees.toLocaleString('en-IN')}`;
}
