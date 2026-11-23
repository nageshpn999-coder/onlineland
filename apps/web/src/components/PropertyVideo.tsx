'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { youTubeEmbed, youTubeThumb } from '@onlineland/shared';
import { photoUrl } from '@/lib/storage-url';
import type { PropertyVideo as Video } from '@/lib/property-types';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/**
 * Listing video. Nothing loads until the visitor presses play (saves their data and our bandwidth):
 * an uploaded MP4 plays in the page; a YouTube video swaps its thumbnail for the privacy-enhanced player.
 */
export function PropertyVideo({ video, title }: { video: Video; title: string }) {
  const t = useTranslations('property');
  const [playing, setPlaying] = useState(false);
  const frame = 'relative aspect-video w-full overflow-hidden rounded-[var(--radius-plot)] bg-ink';

  if (video.kind === 'file') {
    return (
      <figure>
        <video
          className={frame}
          controls
          playsInline
          preload="none"
          poster={video.posterPath ? photoUrl(video.posterPath) : undefined}
          src={photoUrl(video.path)}
          aria-label={t('videoOf', { title })}
          data-testid="property-video"
        />
        {video.durationSec ? <figcaption className="mt-1 text-sm text-ink-soft">{mmss(video.durationSec)}</figcaption> : null}
      </figure>
    );
  }

  if (playing) {
    return (
      <iframe
        className={frame}
        src={youTubeEmbed(video.youtubeId)}
        title={t('videoOf', { title })}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        data-testid="youtube-player"
      />
    );
  }
  return (
    <button type="button" onClick={() => setPlaying(true)} className={`${frame} group block`} data-testid="youtube-facade" aria-label={t('playVideo')}>
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail, loaded lazily */}
      <img src={youTubeThumb(video.youtubeId)} alt="" loading="lazy" className="size-full object-cover opacity-90 group-hover:opacity-100" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full bg-[#d40000] text-white shadow-lg">
          <svg viewBox="0 0 24 24" className="ml-1 size-8" aria-hidden fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
