import { useLocale, useTranslations } from 'next-intl';
import { BRAND, PROPERTY_CATEGORIES, type Locale } from '@onlineland/shared';
import { Link } from '@/i18n/navigation';
import { PHONE_DISPLAY, PHONE_TEL, whatsappLink } from '@/lib/whatsapp';
import { LogoMark } from './icons';

export function SiteFooter() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const locale = useLocale() as Locale;
  const year = new Date().getFullYear();

  const heading = 'font-display text-base font-semibold text-white';
  const link = 'text-white/75 hover:text-white';

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-[1.35rem] font-semibold [font-stretch:92%]">{BRAND.name}</span>
          </div>
          <p className="mt-3 max-w-xs text-white/75">{t('about')}</p>
        </div>

        <div>
          <h2 className={heading}>{t('explore')}</h2>
          <ul className="mt-3 space-y-2">
            {PROPERTY_CATEGORIES.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={{ pathname: '/properties', query: { type: c.id } }} className={link}>
                  {c.label[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={heading}>{t('company')}</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/#services" className={link}>
                {nav('services')}
              </Link>
            </li>
            <li>
              <a href="https://onlineland.in/blog.html" className={link}>
                {nav('blog')}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={heading}>{t('contact')}</h2>
          <address className="mt-3 space-y-2 not-italic text-white/75">
            <p>
              <span className="block text-sm text-white/55">{t('office')}</span>
              {t('address')}
            </p>
            <p>
              <a href={PHONE_TEL} className={link}>
                {t('call')}: {PHONE_DISPLAY}
              </a>
            </p>
            <p>
              <a href={whatsappLink()} className={link}>
                WhatsApp: {PHONE_DISPLAY}
              </a>
            </p>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm text-white/55 sm:px-6 lg:px-8">{t('rights', { year })}</p>
      </div>
    </footer>
  );
}
