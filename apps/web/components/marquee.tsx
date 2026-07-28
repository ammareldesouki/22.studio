'use client';

import { Link } from '../app/i18n/navigation';

export function Marquee({ items }: { items: { name: string; slug: string }[] }) {
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden">
      <div className="marquee">
        {row.map((it, i) => (
          <Link
            key={i}
            href={`/clients/${it.slug}`}
            className="whitespace-nowrap font-display text-[clamp(22px,2.4vw,34px)] font-bold text-[#7c7b74] transition-colors hover:text-red"
            data-cursor
          >
            {it.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
