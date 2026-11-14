import { setRequestLocale } from 'next-intl/server';
import { Categories } from '@/components/Categories';
import { FeaturedProperties } from '@/components/FeaturedProperties';
import { Hero } from '@/components/Hero';
import { SellBand } from '@/components/SellBand';
import { Services } from '@/components/Services';
import { getHomepageProperties } from '@/lib/properties';

// Rebuilt at most every 5 minutes, and immediately when a listing is approved (revalidateTag).
export const revalidate = 300;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const properties = await getHomepageProperties(6);

  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProperties properties={properties} />
      <Services />
      <SellBand />
    </>
  );
}
