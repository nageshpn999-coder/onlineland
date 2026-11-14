import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');
  const tp = useTranslations('property');
  return (
    <div className="bg-mist">
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-[2rem] font-bold leading-tight text-ink [font-stretch:90%]">{t('title')}</h1>
        <p className="mt-3 text-ink-soft">{t('body')}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/properties" className="inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-deep">
            {tp('browse')}
          </Link>
          <Link href="/" className="font-medium text-brand hover:underline">
            {t('home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
