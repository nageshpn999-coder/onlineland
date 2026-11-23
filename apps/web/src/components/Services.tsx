import { useLocale, useTranslations } from 'next-intl';
import { DEFAULT_SERVICES, SERVICE_IDS, type Locale, type ServiceId } from '@onlineland/shared';
import { SERVICE_ICONS } from './icons';
import { ServiceAsk } from './ServiceAsk';

const ICON: Record<ServiceId, keyof typeof SERVICE_ICONS> = {
  drone: 'visit',
  documents: 'docs',
  survey: 'visit',
  registration: 'docs',
  loan: 'consult',
};

/** Paid services (Phase 9): each has an "Ask" button that records a request for the team to call back. */
export function Services() {
  const t = useTranslations('services');
  const locale = useLocale() as Locale;

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
          {SERVICE_IDS.filter((id) => DEFAULT_SERVICES[id].active).map((id) => {
            const s = DEFAULT_SERVICES[id];
            const Icon = SERVICE_ICONS[ICON[id]];
            return (
              <li key={id} className="flex gap-4 border-t border-line py-6" data-testid={`service-${id}`}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-field-soft text-field">
                  <Icon className="size-[22px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[1.2rem] font-semibold leading-snug text-ink">{s.name[locale]}</h3>
                  <p className="mt-1.5 text-ink-soft">{s.desc[locale]}</p>
                  <ServiceAsk serviceId={id} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
