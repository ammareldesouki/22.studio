import { getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { Link } from '../../app/i18n/navigation';
import { ProjectTile } from '../project-tile';
import { Reveal } from '../reveal';
import { withCoverPosters } from '../../lib/vimeo';

export async function Featured({
  locale,
  config = {},
}: {
  locale: Locale;
  config?: { title?: string; maxItems?: number; featured?: boolean };
}) {
  const t = await getTranslations('sections');
  const tc = await getTranslations('common');
  const { items: raw } = await publicContent.listProjects({
    locale,
    featured: config.featured ?? true,
    limit: config.maxItems && config.maxItems > 0 ? config.maxItems : 5,
  });
  if (raw.length === 0) return null;
  const items = await withCoverPosters(raw);
  const heading = config.title?.trim() || t('workHeading');

  return (
    <section className="relative z-[2] bg-ink py-[clamp(44px,6vw,88px)]">
      <div className="wrap">
        <Reveal className="mb-[clamp(36px,5vw,64px)] flex flex-col gap-3.5">
          <p className="eyebrow">{t('workEyebrow')}</p>
          <h2 className="text-[clamp(32px,5.5vw,72px)] text-fg-strong">{heading}</h2>
        </Reveal>
        <Reveal>
          <div className="columns-1 gap-[clamp(16px,2vw,28px)] sm:columns-2 lg:columns-3">
            {items.map((p) => (
              <ProjectTile key={p.id} project={p} viewLabel={tc('viewCase')} />
            ))}
          </div>
        </Reveal>
        <Reveal className="mt-[clamp(28px,4vw,52px)] flex justify-center">
          <Link
            href="/work"
            className="group inline-flex items-center gap-2.5 font-display text-[15px] font-semibold uppercase tracking-[0.1em] text-fg-strong transition-colors hover:text-red"
            data-cursor
          >
            {t('workViewAll')}
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5">
              ↗
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
