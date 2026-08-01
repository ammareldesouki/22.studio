import type { MediaRef } from '@studioflow/core/public';

// Vimeo's official oEmbed endpoint returns the video's own thumbnail image (on Vimeo's CDN).
// We cache it for a week so it is not re-fetched on every render, and swallow every failure so
// callers simply keep their existing placeholder — the poster is a pure progressive enhancement.
export async function vimeoThumbnail(url: string): Promise<string | null> {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (!m) return null;
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?width=1280&url=${encodeURIComponent(`https://vimeo.com/${m[1]}`)}`,
      { next: { revalidate: 604800 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url ?? null;
  } catch {
    return null;
  }
}

// Fill in posterUrl from Vimeo when a media item is a Vimeo link that has no poster of its own,
// so the real video frame shows instantly instead of a blank/placeholder until the player loads.
export async function withVimeoPoster<T extends MediaRef | null | undefined>(m: T): Promise<T> {
  if (!m || m.posterUrl) return m;
  const thumb = await vimeoThumbnail(m.url);
  return (thumb ? { ...m, posterUrl: thumb } : m) as T;
}

// Enrich the cover poster of every project in a list (home + work listings).
export async function withCoverPosters<T extends { cover: MediaRef | null }>(items: T[]): Promise<T[]> {
  return Promise.all(items.map(async (p) => ({ ...p, cover: await withVimeoPoster(p.cover) })));
}
