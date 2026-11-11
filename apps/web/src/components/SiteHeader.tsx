import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { whatsappLink } from '@/lib/whatsapp';
import { ChatIcon, LogoMark, MenuIcon } from './icons';
import { LanguageSwitch } from './LanguageSwitch';

export function SiteHeader() {
  const t = useTranslations('nav');
  const sellMessage = useTranslations('sell')('message');

  const links = [
    { href: { pathname: '/properties', query: { purpose: 'sale' } }, label: t('buy') },
    { href: { pathname: '/properties', query: { purpose: 'rent' } }, label: t('rent') },
    { href: '/#services', label: t('services') },
  ] as const;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label={t('home')}>
          <LogoMark />
          <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink [font-stretch:92%]">
            Online<span className="text-field">Land</span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="text-[0.95rem] font-medium text-ink-soft hover:text-brand">
              {l.label}
            </Link>
          ))}
          <a href="https://onlineland.in/blog.html" className="text-[0.95rem] font-medium text-ink-soft hover:text-brand">
            {t('blog')}
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <a
            href={whatsappLink(sellMessage)}
            className="hidden text-[0.95rem] font-medium text-brand hover:underline lg:inline"
          >
            {t('sell')}
          </a>
          <LanguageSwitch />
          <a
            href={whatsappLink()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-field px-4 text-sm font-semibold text-white hover:bg-[#0b5532]"
          >
            <ChatIcon className="size-5" />
            <span className="hidden sm:inline">{t('whatsapp')}</span>
            <span className="sr-only sm:hidden">{t('whatsapp')}</span>
          </a>

          {/* Mobile menu: works without JavaScript */}
          <details className="group relative md:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-line text-ink [&::-webkit-details-marker]:hidden">
              <MenuIcon className="size-5" />
              <span className="sr-only">{t('menu')}</span>
            </summary>
            <nav
              aria-label="Mobile"
              className="absolute right-0 top-12 w-56 rounded-[var(--radius-plot)] border border-line bg-paper p-2 shadow-[0_12px_32px_-12px_rgba(16,35,71,0.25)]"
            >
              {links.map((l) => (
                <Link key={l.label} href={l.href} className="block rounded px-3 py-2.5 text-ink hover:bg-mist">
                  {l.label}
                </Link>
              ))}
              <a href="https://onlineland.in/blog.html" className="block rounded px-3 py-2.5 text-ink hover:bg-mist">
                {t('blog')}
              </a>
              <a href={whatsappLink(sellMessage)} className="block rounded px-3 py-2.5 font-medium text-brand hover:bg-mist">
                {t('sell')}
              </a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
