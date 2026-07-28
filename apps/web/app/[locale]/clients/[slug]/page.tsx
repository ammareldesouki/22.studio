import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { ProjectTile } from '../../../../components/project-tile';
import { Reveal } from '../../../../components/reveal';
import { CtaBanner } from '../../../../components/sections/cta-banner';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = await publicContent.getClientBySlug(slug, locale as Locale);
  if (!c) return {};
  return { title: `${c.name} — 22 Studio` };
}

export default async function ClientDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const c = await publicContent.getClientBySlug(slug, l);
  if (!c) notFound();
  const t = await getTranslations('clients');
  const tc = await getTranslations('common');

  return (
    <>
      <div className="pt-32">
        <section className="wrap py-[clamp(48px,8vw,120px)]">
          <Reveal className="flex flex-col gap-5">
            <p className="eyebrow">{t('title')}</p>
            <h1 className="text-[clamp(44px,8vw,120px)] text-white">{c.name}</h1>
            {c.website && (
              <a href={c.website} target="_blank" rel="noopener" className="label !text-red" data-cursor>
                {t('visit')} →
              </a>
            )}
          </Reveal>
        </section>

        {c.projects.length > 0 && (
          <section className="wrap pb-[clamp(72px,11vw,140px)]">
            <Reveal className="mb-8">
              <p className="eyebrow">{t('theirWork', { name: c.name })}</p>
            </Reveal>
            <Reveal>
              <div className="grid grid-cols-12 gap-[clamp(16px,2vw,28px)]">
                {c.projects.map((p, i) => (
                  <ProjectTile key={p.id} project={p} viewLabel={tc('viewCase')} variant={i % 3 === 0 ? 'wide' : 'half'} />
                ))}
              </div>
            </Reveal>
          </section>
        )}
      </div>
      <CtaBanner />
    </>
  );
}
