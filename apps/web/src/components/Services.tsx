import { useTranslations } from 'next-intl';
import { SERVICE_ICONS } from './icons';

const SERVICES = ['consult', 'docs', 'visit', 'sell'] as const;

export function Services() {
  const t = useTranslations('services');

  return (
    <section id="services" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <div>
          <h2 className="text-[2rem] font-bold leading-tight tracking-tight text-ink [font-stretch:90%] sm:text-[2.4rem]">
            {t('title')}
          </h2>
          <p className="mt-3 max-w-sm text-ink-soft">{t('lead')}</p>
        </div>

        <ul className="grid gap-x-10 sm:grid-cols-2">
          {SERVICES.map((key) => {
            const Icon = SERVICE_ICONS[key];
            return (
              <li key={key} className="flex gap-4 border-t border-line py-6">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-field-soft text-field">
                  <Icon className="size-[22px]" />
                </span>
                <div>
                  <h3 className="text-[1.2rem] font-semibold leading-snug text-ink">{t(`${key}.title`)}</h3>
                  <p className="mt-1.5 text-ink-soft">{t(`${key}.body`)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
