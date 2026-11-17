import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@onlineland/shared';
import { routing } from '@/i18n/routing';
import { LEGAL, LEGAL_DOCS, LEGAL_UPDATED, type LegalDoc } from '@/lib/legal';

type Params = Promise<{ locale: string; doc: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => LEGAL_DOCS.map((doc) => ({ locale, doc })));
}

export const dynamicParams = false;

function page(locale: string, doc: string) {
  if (!(LEGAL_DOCS as readonly string[]).includes(doc)) return null;
  return LEGAL[(locale === 'en' ? 'en' : 'te') as Locale][doc as LegalDoc];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, doc } = await params;
  const p = page(locale, doc);
  if (!p) return {};
  return {
    title: `${p.title} | OnlineLand`,
    alternates: { canonical: `/${locale}/legal/${doc}`, languages: { te: `/te/legal/${doc}`, en: `/en/legal/${doc}` } },
  };
}

export default async function LegalPageView({ params }: { params: Params }) {
  const { locale, doc } = await params;
  setRequestLocale(locale);
  const p = page(locale, doc);
  if (!p) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-[2rem] font-bold leading-tight text-ink [font-stretch:90%]">{p.title}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {locale === 'en' ? 'Last updated' : 'చివరి మార్పు'}: {LEGAL_UPDATED}
      </p>
      <p className="mt-6 text-lg text-ink">{p.intro}</p>
      {p.sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="text-xl font-semibold text-ink">{s.heading}</h2>
          {groupParagraphs(s.body).map((block, i) =>
            Array.isArray(block) ? (
              <ul key={i} className="mt-3 list-disc space-y-1.5 pl-6 text-ink">
                {block.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            ) : (
              <p key={i} className="mt-3 text-ink">
                {block}
              </p>
            ),
          )}
        </section>
      ))}
    </article>
  );
}

/** Consecutive "• " lines become one list. */
function groupParagraphs(lines: string[]): (string | string[])[] {
  const out: (string | string[])[] = [];
  for (const l of lines) {
    if (l.startsWith('• ')) {
      const last = out[out.length - 1];
      if (Array.isArray(last)) last.push(l.slice(2));
      else out.push([l.slice(2)]);
    } else out.push(l);
  }
  return out;
}
