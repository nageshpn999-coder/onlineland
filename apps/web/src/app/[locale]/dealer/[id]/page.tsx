import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ChatIcon, PhoneIcon } from '@/components/icons';
import { PropertyCard } from '@/components/PropertyCard';
import { getDealerCard } from '@/lib/dealers';
import { getPropertiesByOwner } from '@/lib/properties';

type Params = Promise<{ locale: string; id: string }>;

export const revalidate = 300;

/** Pro plan dealer page (D7): the dealer's live listings and their own contact. */
async function load(id: string) {
  const dealer = await getDealerCard(id);
  if (!dealer?.dealerPage) return null;
  return { dealer, properties: await getPropertiesByOwner(id) };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  const data = await load(id);
  if (!data) return { title: 'OnlineLand', robots: { index: false } };
  const t = await getTranslations({ locale, namespace: 'dealer' });
  return { title: `${data.dealer.name} — ${t('title')} | OnlineLand`, alternates: { canonical: `/${locale}/dealer/${id}` } };
}

export default async function DealerPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const data = await load(id);
  if (!data) notFound();
  const { dealer, properties } = data;
  const t = await getTranslations('dealer');
  const tp = await getTranslations('property');

  return (
    <div className="bg-mist">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-[var(--radius-plot)] border border-line bg-paper p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-field">{t('title')}</p>
            <h1 className="mt-1 text-[2rem] font-bold leading-tight text-ink [font-stretch:90%]">
              {dealer.name}
              {dealer.verified && <span className="ml-2 align-middle text-base font-semibold text-field">✓ {tp('verifiedDealer')}</span>}
            </h1>
            <p className="mt-1 text-ink-soft">{t('count', { n: properties.length })}</p>
          </div>
          {dealer.phone && (
            <div className="flex gap-3">
              <a href={`https://wa.me/91${dealer.phone}`} target="_blank" rel="noopener" className="inline-flex h-12 items-center gap-2 rounded-full bg-field px-5 font-semibold text-white">
                <ChatIcon className="size-5" />
                {tp('whatsapp')}
              </a>
              <a href={`tel:+91${dealer.phone}`} className="inline-flex h-12 items-center gap-2 rounded-full border border-brand px-5 font-semibold text-brand">
                <PhoneIcon className="size-5" />
                {tp('call')}
              </a>
            </div>
          )}
        </div>

        {properties.length === 0 ? (
          <p className="mt-10 text-center text-ink-soft">{t('empty')}</p>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <li key={p.id}>
                <PropertyCard property={p} refId={id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
