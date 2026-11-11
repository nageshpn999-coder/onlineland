/** Languages supported across website, app and admin. Telugu is the default. */
export const LOCALES = ['te', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'te';

/** Any visitor-facing text is stored in both languages. */
export type LocalizedText = Record<Locale, string>;

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
