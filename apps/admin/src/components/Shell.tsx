'use client';

/** Page frame: checks the staff role, then shows the menu and the page. */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { isStaffRole, logout, useAuth } from '@/lib/auth';
import { useI18n, type Key } from '@/lib/i18n';
import { Button } from './ui';

const NAV: { href: string; key: Key; adminOnly: boolean }[] = [
  { href: '/', key: 'overview', adminOnly: true },
  { href: '/listings/', key: 'listings', adminOnly: true },
  { href: '/leads/', key: 'leads', adminOnly: false },
  { href: '/visits/', key: 'visits', adminOnly: false },
  { href: '/payments/', key: 'payments', adminOnly: true },
  { href: '/users/', key: 'users', adminOnly: true },
  { href: '/settings/', key: 'settings', adminOnly: true },
  { href: '/audit/', key: 'audit', adminOnly: true },
];

export function Shell({ children, adminOnly = true }: { children: ReactNode; adminOnly?: boolean }) {
  const { ready, user, role } = useAuth();
  const { t, toggle } = useI18n();
  const router = useRouter();
  const path = usePathname();
  const [menu, setMenu] = useState(false);

  const allowed = ready && user && isStaffRole(role) && (!adminOnly || role === 'admin');
  useEffect(() => {
    if (!ready) return;
    if (!user || !isStaffRole(role)) router.replace('/login/');
    else if (adminOnly && role !== 'admin') router.replace('/leads/');
  }, [ready, user, role, adminOnly, router]);

  if (!allowed) return <p className="p-10 text-center text-ink-soft">{t('loading')}</p>;

  const items = NAV.filter((n) => role === 'admin' || !n.adminOnly);
  const nav = (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {items.map((n) => {
        const active = n.href === '/' ? path === '/' : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setMenu(false)}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${active ? 'bg-brand text-white' : 'text-ink hover:bg-mist'}`}
          >
            {t(n.key)}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-mist md:grid md:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-line bg-white p-4 md:flex md:flex-col md:gap-6">
        <Brand />
        {nav}
        <div className="mt-auto space-y-2 text-sm">
          <p className="truncate text-ink-soft" title={user?.phoneNumber ?? ''}>{user?.phoneNumber}</p>
          <div className="flex gap-2">
            <Button tone="quiet" onClick={toggle}>{t('language')}</Button>
            <Button tone="quiet" onClick={() => logout()}>{t('signOut')}</Button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-2 md:hidden">
        <Brand />
        <div className="flex gap-2">
          <Button tone="quiet" onClick={toggle}>{t('language')}</Button>
          <Button tone="quiet" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu((m) => !m)}>☰</Button>
        </div>
      </header>
      {menu && (
        <div className="border-b border-line bg-white p-3 md:hidden">
          {nav}
          <Button tone="quiet" className="mt-2 w-full" onClick={() => logout()}>{t('signOut')}</Button>
        </div>
      )}

      <main className="min-w-0 p-4 md:p-8">
        {role === 'agent' && <p className="mb-4 rounded-md bg-white p-3 text-sm text-ink-soft">{t('agentView')}</p>}
        {children}
      </main>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
        <rect x="2" y="2" width="24" height="24" rx="5" fill="#1456C8" />
        <path d="M7 19 L14 9 L21 19 Z" fill="#fff" />
        <rect x="7" y="19" width="14" height="3" fill="#0F6B3F" />
      </svg>
      <span>
        Online<span className="text-field">Land</span>
      </span>
    </Link>
  );
}
