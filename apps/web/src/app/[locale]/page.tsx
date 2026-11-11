import { setRequestLocale } from 'next-intl/server';
import { Categories } from '@/components/Categories';
import { FeaturedProperties } from '@/components/FeaturedProperties';
import { Hero } from '@/components/Hero';
import { SellBand } from '@/components/SellBand';
import { Services } from '@/components/Services';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProperties />
      <Services />
      <SellBand />
    </>
  );
}
