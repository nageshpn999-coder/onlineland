export const MOBILE_RE = /^[6-9]\d{9}$/;

/** Accepts "98765 43210", "+91 9876543210", "09876543210" → "9876543210". */
export function normalizeMobile(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}
