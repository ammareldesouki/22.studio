import Image from 'next/image';
import type { ProjectCard } from '@studioflow/core/public';
import { Link } from '../app/i18n/navigation';
import { poster } from '../lib/poster';

export function ProjectTile({
  project,
  viewLabel,
  variant = 'half',
}: {
  project: ProjectCard;
  viewLabel: string;
  variant?: 'wide' | 'half';
}) {
  const span = variant === 'wide' ? 'md:col-span-12' : 'md:col-span-6';
  const aspect = variant === 'wide' ? 'aspect-[21/9]' : 'aspect-[16/10]';

  return (
    <Link
      href={`/work/${project.slug}`}
      data-cursor={viewLabel}
      className={`group relative col-span-12 block overflow-hidden bg-card ${span} ${aspect}`}
    >
      <div
        className="absolute inset-0 transition-transform duration-[1100ms] ease-expo group-hover:scale-105"
        style={project.cover ? undefined : { background: poster(project.slug) }}
      >
        {project.cover && (
          <Image src={project.cover.url} alt={project.cover.alt || project.title} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover" />
        )}
      </div>
      <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,12,0.86))' }} />
      <div className="absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between gap-5 p-[clamp(20px,2.4vw,40px)]">
        <div>
          <p className="mb-2.5 flex flex-wrap gap-x-3.5 gap-y-1 font-display text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {project.client && <span className="text-red">{project.client.name}</span>}
            {project.services.slice(0, 2).map((s) => (
              <span key={s.slug}>{s.name}</span>
            ))}
          </p>
          <h3 className="text-[clamp(22px,2.6vw,40px)] text-white">{project.title}</h3>
        </div>
        <span className="flex -translate-x-2 items-center gap-2 whitespace-nowrap font-display text-xs font-semibold uppercase tracking-[0.12em] text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 rtl:translate-x-2 rtl:group-hover:translate-x-0">
          {viewLabel} →
        </span>
      </div>
    </Link>
  );
}
