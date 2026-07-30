// Classify a media item (uploaded or linked) so the site can render it correctly:
// a still image, a YouTube/Vimeo embed, or a direct video file.
export interface EmbedInfo {
  kind: 'image' | 'youtube' | 'vimeo' | 'file';
  embedUrl?: string; // iframe src for youtube/vimeo
  thumbUrl?: string; // a still poster where we can derive one (youtube)
  fileUrl?: string; // direct <video> src
}

export function classifyMedia(url: string, type?: string): EmbedInfo {
  const u = url || '';

  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt || type === 'YOUTUBE') {
    const id = yt?.[1];
    return {
      kind: 'youtube',
      embedUrl: id ? `https://www.youtube.com/embed/${id}` : u,
      thumbUrl: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined,
    };
  }

  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm || type === 'VIMEO') {
    const id = vm?.[1];
    return { kind: 'vimeo', embedUrl: id ? `https://player.vimeo.com/video/${id}` : u };
  }

  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u) || type === 'VIDEO') {
    return { kind: 'file', fileUrl: u };
  }

  return { kind: 'image' };
}

// The best still image to represent a media item (its own URL for images,
// a derived poster for YouTube). Null when there's no still (Vimeo/plain video file).
export function posterFor(url: string, type?: string): string | null {
  const info = classifyMedia(url, type);
  if (info.kind === 'image') return url;
  if (info.kind === 'youtube' && info.thumbUrl) return info.thumbUrl;
  return null;
}

// A muted, looping, autoplaying source for hover previews. iframe for YouTube/Vimeo
// (background mode), a direct <video> for files. Null for images.
export function hoverVideo(url: string, type?: string): { mode: 'iframe' | 'video'; src: string } | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if ((yt || type === 'YOUTUBE') && yt?.[1]) {
    const id = yt[1];
    return { mode: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&playsinline=1&rel=0` };
  }
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if ((vm || type === 'VIMEO') && vm?.[1]) {
    return { mode: 'iframe', src: `https://player.vimeo.com/video/${vm[1]}?background=1&autoplay=1&muted=1&loop=1` };
  }
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url) || type === 'VIDEO') {
    return { mode: 'video', src: url };
  }
  return null;
}
