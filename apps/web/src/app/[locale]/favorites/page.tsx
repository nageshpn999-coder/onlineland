import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FavoritesList } from '@/components/FavoritesList';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'favorites' });
  return { title: `${t('title')} | OnlineLand`, robots: { index: false } };
}

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('favorites');

  return (
    <div className="bg-mist">
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 lg:pt-12">
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-ink [font-stretch:90%] sm:text-[2.5rem]">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">{t('lead')}</p>
        <FavoritesList />
      </div>
    </div>
  );
}
