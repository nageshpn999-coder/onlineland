import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BRAND } from '@onlineland/shared';
import { routing } from '@/i18n/routing';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

import '@fontsource-variable/anek-telugu/standard.css';
import '@fontsource-variable/noto-sans-telugu/index.css';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${BRAND.domain}`;

  return {
    metadataBase: new URL(siteUrl),
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: { te: '/te', en: '/en' },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      siteName: BRAND.name,
      locale: locale === 'te' ? 'te_IN' : 'en_IN',
      type: 'website',
    },
    icons: { icon: '/icon.svg' },
  };
}

export const viewport: Viewport = {
  themeColor: BRAND.colors.blue,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
