import { setRequestLocale, getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { ProjectTile } from '../../../components/project-tile';
import { Reveal } from '../../../components/reveal';

export const revalidate = 300;

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations('work');
  const tc = await getTranslations('common');
  const { items } = await publicContent.listProjects({ locale: l, limit: 24 });

  return (
    <div className="pt-32">
      <section className="wrap py-[clamp(48px,8vw,110px)]">
        <Reveal className="flex flex-col gap-4">
          <p className="eyebrow">{t('title')}</p>
          <h1 className="text-[clamp(40px,7vw,100px)] text-white">{t('heading')}</h1>
          <p className="max-w-[40ch] text-[clamp(15px,1.3vw,18px)] text-muted">{t('sub')}</p>
        </Reveal>
      </section>

      <section className="wrap pb-[clamp(72px,11vw,160px)]">
        {items.length === 0 ? (
          <p className="text-muted">{t('empty')}</p>
        ) : (
          <Reveal>
            <div className="grid grid-cols-12 gap-[clamp(16px,2vw,28px)]">
              {items.map((p, i) => (
                <ProjectTile key={p.id} project={p} viewLabel={tc('viewCase')} variant={i % 3 === 0 ? 'wide' : 'half'} />
              ))}
            </div>
          </Reveal>
        )}
      </section>
    </div>
  );
}
