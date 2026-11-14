'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFavorites } from '@/lib/favorites';
import { HeartIcon } from './FavoriteButton';

export function FavoritesLink({ className = '' }: { className?: string }) {
  const t = useTranslations('nav');
  const { items } = useFavorites();
  return (
    <Link
      href="/favorites"
      aria-label={`${t('favorites')}${items.length ? ` (${items.length})` : ''}`}
      className={`relative size-10 items-center justify-center rounded-full border border-line text-ink hover:border-brand hover:text-brand ${className || 'flex'}`}
    >
      <HeartIcon filled={items.length > 0} className={`size-5 ${items.length ? 'text-field' : ''}`} />
      {items.length > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-field px-1 text-center text-[11px] font-bold leading-5 text-white">
          {items.length}
        </span>
      )}
    </Link>
  );
}
