import { setRequestLocale, getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { ProjectTile } from '../../../components/project-tile';
import { Reveal } from '../../../components/reveal';
import { withCoverPosters } from '../../../lib/vimeo';

export const revalidate = 300;

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations('work');
  const tc = await getTranslations('common');
  const { items: raw } = await publicContent.listProjects({ locale: l, limit: 24 });
  const items = await withCoverPosters(raw);

  return (
    <div className="pt-32">
      <section className="wrap py-[clamp(48px,8vw,110px)]">
        <Reveal className="flex flex-col gap-4">
          <p className="eyebrow">{t('title')}</p>
          <h1 className="text-[clamp(40px,7vw,100px)] text-fg-strong">{t('heading')}</h1>
          <p className="max-w-[40ch] text-[clamp(15px,1.3vw,18px)] text-muted">{t('sub')}</p>
        </Reveal>
      </section>

      <section className="wrap pb-[clamp(72px,11vw,160px)]">
        {items.length === 0 ? (
          <p className="text-muted">{t('empty')}</p>
        ) : (
          <Reveal>
            <div className="columns-1 gap-[clamp(16px,2vw,28px)] sm:columns-2 lg:columns-3">
              {items.map((p) => (
                <ProjectTile key={p.id} project={p} viewLabel={tc('viewCase')} />
              ))}
            </div>
          </Reveal>
        )}
      </section>
    </div>
  );
}
