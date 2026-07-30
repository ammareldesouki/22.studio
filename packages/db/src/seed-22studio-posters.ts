import './load-env';
import { db } from './client';

// Fetch a still poster frame for each Vimeo media via Vimeo's public oEmbed API and store it,
// so the work grid shows a real thumbnail (and hover plays the video).

function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] ?? null;
}

async function main() {
  const vids = await db.media.findMany({ where: { type: 'VIMEO' }, select: { id: true, url: true } });
  let done = 0;
  for (const v of vids) {
    const id = vimeoId(v.url);
    if (!id) continue;
    try {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=1280`);
      if (!res.ok) continue;
      const data = (await res.json()) as { thumbnail_url?: string; width?: number; height?: number };
      if (data.thumbnail_url) {
        await db.media.update({
          where: { id: v.id },
          data: {
            posterUrl: data.thumbnail_url,
            width: typeof data.width === 'number' ? data.width : null,
            height: typeof data.height === 'number' ? data.height : null,
          },
        });
        done++;
      }
    } catch {
      // skip on network error; safe to re-run
    }
  }
  console.log(`Poster frames set for ${done}/${vids.length} Vimeo videos.`);
}

main().then(() => db.$disconnect()).catch((e) => {
  console.error(e);
  return db.$disconnect().finally(() => process.exit(1));
});
