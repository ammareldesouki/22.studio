'use client';

import { Link } from '../app/i18n/navigation';

export function Marquee({ items }: { items: { name: string; slug: string; logoUrl?: string | null; displayMode?: string }[] }) {
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden">
      <div className="marquee">
        {row.map((it, i) => {
          const mode = it.displayMode ?? 'both';
          const showLogo = mode !== 'name' && !!it.logoUrl;
          // "logo only" with no logo falls back to the name so the item is never blank.
          const showName = mode !== 'logo' || !it.logoUrl;
          return (
            <Link
              key={i}
              href={`/clients/${it.slug}`}
              className="group flex items-center gap-3.5 whitespace-nowrap font-display text-[clamp(22px,2.4vw,34px)] font-bold text-muted transition-colors hover:text-red"
              data-cursor
              aria-label={it.name}
            >
              {showLogo && (
                <img
                  src={it.logoUrl as string}
                  alt={showName ? '' : it.name}
                  className="h-[clamp(26px,2.6vw,40px)] w-auto object-contain opacity-60 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                />
              )}
              {showName && <span>{it.name}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
