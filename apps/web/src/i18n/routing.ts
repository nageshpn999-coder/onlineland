import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from '@onlineland/shared';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  // Telugu first for everyone; a visitor's own choice is remembered by cookie.
  localeDetection: false,
});
