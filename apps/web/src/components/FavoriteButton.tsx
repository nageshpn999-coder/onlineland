'use client';

import { useTranslations } from 'next-intl';
import { useFavorites, type FavoriteItem } from '@/lib/favorites';

type Props = { item: Omit<FavoriteItem, 'savedAt'>; variant?: 'icon' | 'full'; className?: string };

export function HeartIcon({ filled, className = '' }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
    </svg>
  );
}

export function FavoriteButton({ item, variant = 'icon', className = '' }: Props) {
  const t = useTranslations('property');
  const { has, toggle } = useFavorites();
  const saved = has(item.id);

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={() => toggle(item)}
        aria-pressed={saved}
        className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${
          saved ? 'border-field bg-field-soft text-field' : 'border-line text-ink hover:border-brand hover:text-brand'
        } ${className}`}
      >
        <HeartIcon filled={saved} className="size-5" />
        {saved ? t('saved') : t('save')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggle(item);
      }}
      aria-pressed={saved}
      aria-label={saved ? t('saved') : t('save')}
      className={`flex size-10 items-center justify-center rounded-full bg-paper/95 shadow-[0_2px_8px_rgba(16,35,71,0.15)] ${
        saved ? 'text-field' : 'text-ink-soft hover:text-field'
      } ${className}`}
    >
      <HeartIcon filled={saved} className="size-[22px]" />
    </button>
  );
}
