import { getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { ProjectTile } from '../project-tile';
import { Reveal } from '../reveal';

export async function Featured({ locale }: { locale: Locale }) {
  const t = await getTranslations('sections');
  const tc = await getTranslations('common');
  const { items } = await publicContent.listProjects({ locale, featured: true, limit: 5 });
  if (items.length === 0) return null;

  return (
    <section className="relative z-[2] bg-ink py-[clamp(72px,11vw,160px)]">
      <div className="wrap">
        <Reveal className="mb-[clamp(36px,5vw,64px)] flex flex-col gap-3.5">
          <p className="eyebrow">{t('workEyebrow')}</p>
          <h2 className="text-[clamp(32px,5.5vw,72px)] text-white">{t('workHeading')}</h2>
        </Reveal>
        <Reveal>
          <div className="grid grid-cols-12 gap-[clamp(16px,2vw,28px)]">
            {items.map((p, i) => (
              <ProjectTile key={p.id} project={p} viewLabel={tc('viewCase')} variant={i === 0 ? 'wide' : 'half'} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
