import { useTranslations } from 'next-intl';
import { whatsappLink } from '@/lib/whatsapp';
import { ChatIcon } from './icons';

export function SellBand() {
  const t = useTranslations('sell');

  return (
    <section className="bg-field text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-14">
        <div>
          <h2 className="text-[1.75rem] font-bold leading-tight [font-stretch:90%] sm:text-[2.1rem]">{t('title')}</h2>
          <p className="mt-2 text-white/85">{t('body')}</p>
        </div>
        <a
          href={whatsappLink(t('message'))}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-paper px-6 font-semibold text-field hover:bg-field-soft lg:self-auto"
        >
          <ChatIcon className="size-5" />
          {t('cta')}
        </a>
      </div>
    </section>
  );
}
