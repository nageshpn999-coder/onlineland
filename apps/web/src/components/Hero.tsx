import { useTranslations } from 'next-intl';
import { SearchPanel } from './SearchPanel';
import { SurveyMap } from './SurveyMap';

export function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="border-b border-line bg-mist">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14 lg:px-8 lg:pb-20 lg:pt-16">
        <div>
          <h1 className="max-w-[16ch] text-[2.5rem] font-bold leading-[1.15] tracking-tight text-ink [font-stretch:88%] sm:text-[3.25rem] lg:text-[3.6rem]">
            {t('title')}
          </h1>
          <p className="mt-5 max-w-[52ch] text-[1.08rem] text-ink-soft sm:text-lg">{t('lead')}</p>
          <div className="mt-8">
            <SearchPanel />
          </div>
        </div>
        <SurveyMap />
      </div>
    </section>
  );
}
