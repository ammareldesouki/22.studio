'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { ProjectCard } from '@studioflow/core/public';
import { Link } from '../app/i18n/navigation';
import { poster } from '../lib/poster';
import { posterFor, hoverVideo } from '../lib/media-embed';

// Each tile takes the natural aspect ratio of its cover media (vertical reels stay vertical),
// and the video autoplays (muted, looping) whenever the tile is on screen — poster underneath,
// unmounted when far off screen to keep performance sane.
export function ProjectTile({ project, viewLabel }: { project: ProjectCard; viewLabel: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [inView, setInView] = useState(false);

  const cover = project.cover;
  const still = cover ? cover.posterUrl || posterFor(cover.url, cover.type) : null;
  const hv = cover ? hoverVideo(cover.url, cover.type) : null;
  const ratio = cover?.width && cover?.height ? `${cover.width} / ${cover.height}` : '4 / 5';

  useEffect(() => {
    const el = ref.current;
    if (!el || !hv) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), {
      rootMargin: '150px 0px',
      threshold: 0.15,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hv]);

  return (
    <Link
      ref={ref}
      href={`/work/${project.slug}`}
      data-cursor={viewLabel}
      className="group relative mb-[clamp(16px,2vw,28px)] block break-inside-avoid overflow-hidden bg-card"
      style={{ aspectRatio: ratio }}
    >
      {/* Still frame (or generated gradient) */}
      <div
        className="absolute inset-0 transition-transform duration-[1100ms] ease-expo group-hover:scale-[1.03]"
        style={still ? undefined : { background: poster(project.slug) }}
      >
        {still && <Image src={still} alt={cover?.alt || project.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />}
      </div>

      {/* Autoplaying muted preview while on screen — fades in once loaded so the poster shows first */}
      {inView && hv && (
        <div className="absolute inset-0 overflow-hidden">
          {hv.mode === 'iframe' ? (
            <iframe
              src={hv.src}
              title={project.title}
              tabIndex={-1}
              onLoad={(e) => e.currentTarget.classList.replace('opacity-0', 'opacity-100')}
              className="pointer-events-none absolute left-1/2 top-1/2 h-[104%] w-[104%] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-700"
              allow="autoplay; fullscreen; picture-in-picture"
            />
          ) : (
            <video
              src={hv.src}
              autoPlay
              muted
              loop
              playsInline
              onCanPlay={(e) => e.currentTarget.classList.replace('opacity-0', 'opacity-100')}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700"
            />
          )}
        </div>
      )}

      {/* Scrim */}
      <div className="pointer-events-none absolute inset-0 z-[3]" style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(10,10,12,0.92))' }} />

      {/* Overlay: client logo + name + service + title */}
      <div className="absolute inset-x-0 bottom-0 z-[4] p-[clamp(16px,1.6vw,26px)]">
        <div className="mb-2 flex items-center gap-2.5">
          {project.client?.logoUrl && <img src={project.client.logoUrl} alt="" className="h-5 w-auto max-w-[72px] object-contain" />}
          <p className="flex flex-wrap gap-x-3 gap-y-0.5 font-display text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            {project.client && <span className="text-red">{project.client.name}</span>}
            {project.services.slice(0, 1).map((s) => (
              <span key={s.slug}>{s.name}</span>
            ))}
          </p>
        </div>
        <h3 className="text-[clamp(18px,1.7vw,26px)] leading-tight text-white">{project.title}</h3>
      </div>
    </Link>
  );
}
