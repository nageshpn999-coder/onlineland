import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCategory, type Locale } from '@onlineland/shared';
import { Link } from '@/i18n/navigation';
import { whatsappLink } from '@/lib/whatsapp';
import { ChatIcon } from '@/components/icons';

/**
 * Search target. Real results from Firestore arrive in Phase 5;
 * until then this page passes the visitor's search to WhatsApp so no enquiry is lost.
 */
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'properties' });
  return { title: `${t('title')} | OnlineLand`, robots: { index: false } };
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 80) ?? '';
}

export default async function PropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations('properties');
  const ts = await getTranslations('search');

  const purpose = one(sp.purpose) === 'rent' ? 'rent' : 'sale';
  const type = getCategory(one(sp.type));
  const q = one(sp.q);
  const budget = one(sp.budget);
  const budgetKey = `${purpose === 'rent' ? 'budgetsRent' : 'budgetsSale'}.${budget}`;
  const budgetLabel = budget && ts.has(budgetKey) ? ts(budgetKey) : '';

  const parts = [
    purpose === 'rent' ? ts('rent') : ts('buy'),
    type?.label[locale as Locale],
    q,
    budgetLabel,
  ].filter(Boolean) as string[];

  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
        <h1 className="text-[2.2rem] font-bold leading-tight tracking-tight text-ink [font-stretch:90%] sm:text-[2.8rem]">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-ink-soft">{t('body')}</p>

        {parts.length > 0 && (
          <div className="mt-8 rounded-[var(--radius-plot)] border border-line bg-paper p-5">
            <p className="text-sm font-medium text-ink-soft">{t('youSearched')}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {parts.map((p) => (
                <li key={p} className="rounded-full bg-field-soft px-3 py-1 text-sm font-medium text-field">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href={whatsappLink(t('message', { query: parts.join(', ') }))}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-field px-6 font-semibold text-white hover:bg-[#0b5532]"
          >
            <ChatIcon className="size-5" />
            {t('cta')}
          </a>
          <Link href="/" className="font-medium text-brand hover:underline">
            {t('back')}
          </Link>
        </div>
      </div>
    </section>
  );
}
