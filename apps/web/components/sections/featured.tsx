import { getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { ProjectTile } from '../project-tile';
import { Reveal } from '../reveal';

export async function Featured({
  locale,
  config = {},
}: {
  locale: Locale;
  config?: { title?: string; maxItems?: number; featured?: boolean };
}) {
  const t = await getTranslations('sections');
  const tc = await getTranslations('common');
  const { items } = await publicContent.listProjects({
    locale,
    featured: config.featured ?? true,
    limit: config.maxItems && config.maxItems > 0 ? config.maxItems : 5,
  });
  if (items.length === 0) return null;
  const heading = config.title?.trim() || t('workHeading');

  return (
    <section className="relative z-[2] bg-ink py-[clamp(72px,11vw,160px)]">
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
      </div>
    </section>
  );
}
