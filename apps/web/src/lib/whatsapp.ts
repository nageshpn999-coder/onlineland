import { BRAND } from '@onlineland/shared';

/** Opens a WhatsApp chat with OnlineLand, optionally with a pre-filled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${BRAND.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Display form of the business number, e.g. +91 99597 31120. */
export const PHONE_DISPLAY = `+91 ${BRAND.whatsapp.slice(2, 7)} ${BRAND.whatsapp.slice(7)}`;
export const PHONE_TEL = `tel:+${BRAND.whatsapp}`;
