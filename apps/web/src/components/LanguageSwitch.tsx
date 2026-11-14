'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export function LanguageSwitch({ className = '' }: { className?: string }) {
  const t = useTranslations('language');
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === 'te' ? 'en' : 'te';

  return (
    <Link
      href={pathname}
      locale={other}
      lang={other}
      hrefLang={other}
      aria-label={`${t('label')}: ${t('switchTo')}`}
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-line px-3 sm:px-4 text-sm font-medium text-ink hover:border-brand hover:text-brand ${className}`}
    >
      <span className="sm:hidden">{other === 'en' ? 'EN' : 'తె'}</span>
      <span className="hidden sm:inline">{t('switchTo')}</span>
    </Link>
  );
}
