/**
 * Listing media: photos, one uploaded video (compressed on the phone) or a YouTube link.
 * Stored in properties/{id}/media/{mediaId}; files under properties/{id}/ (videos in videos/).
 */

export const MEDIA_TYPES = ['photo', 'video', 'youtube'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

/** Limits shared by the app, website, admin and the security rules. */
export const VIDEO_LIMITS = {
  maxSeconds: 120, // 2 minutes
  maxBytes: 60 * 1024 * 1024, // after compression a 2-minute 720p video is ~15–25 MB
  maxPerListing: 1,
} as const;

/** YouTube video id (11 chars) from any common link, or null. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m =
    s.match(/^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})(?:[&#]|$)/) ??
    s.match(/^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})(?:[/?#]|$)/) ??
    s.match(/^(?:https?:\/\/)?youtu\.be\/([A-Za-z0-9_-]{11})(?:[/?#]|$)/);
  return m?.[1] ?? null;
}

export const youTubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youTubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
export const youTubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
