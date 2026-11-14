'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { PropertyCategory } from '@onlineland/shared';
import { IMAGES_UNOPTIMIZED, photoUrl } from '@/lib/storage-url';
import { PropertyArt } from './PropertyArt';

export function PropertyGallery({ photos, title, category }: { photos: string[]; title: string; category: PropertyCategory }) {
  const t = useTranslations('property');
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-plot)] border border-line bg-mist">
        <PropertyArt category={category} />
        <span className="absolute bottom-3 left-3 rounded-full bg-paper/95 px-3 py-1 text-sm text-ink-soft">{t('noPhotos')}</span>
      </div>
    );
  }

  const total = photos.length;
  const go = (n: number) => setIndex((n + total) % total);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1);
        if (e.key === 'ArrowLeft') go(index - 1);
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-plot)] border border-line bg-ink">
        <Image
          key={photos[index]}
          src={photoUrl(photos[index]!)}
          alt={`${title} — ${t('photo', { n: index + 1, total })}`}
          fill
          sizes="(min-width: 1024px) 720px, 100vw"
          className="object-contain"
          priority={index === 0}
          unoptimized={IMAGES_UNOPTIMIZED}
        />
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={t('prevPhoto')}
              className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-xl text-ink hover:bg-paper"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={t('nextPhoto')}
              className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-xl text-ink hover:bg-paper"
            >
              ›
            </button>
          </>
        )}
        <span className="absolute bottom-3 right-3 rounded-full bg-ink/75 px-3 py-1 text-sm text-white" aria-live="polite">
          {t('photo', { n: index + 1, total })}
        </span>
      </div>

      {total > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <li key={p} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t('showPhoto', { n: i + 1 })}
                aria-current={i === index}
                className={`relative block h-16 w-24 overflow-hidden rounded border-2 ${i === index ? 'border-brand' : 'border-transparent opacity-80 hover:opacity-100'}`}
              >
                <Image src={photoUrl(p)} alt="" fill sizes="96px" className="object-cover" unoptimized={IMAGES_UNOPTIMIZED} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
