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
  const s = await publicContent.getServiceBySlug(slug, locale as Locale);
  if (!s) return {};
  return { title: `${s.name} — 22 Studio`, description: s.description || undefined };
}

export default async function ServiceDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const s = await publicContent.getServiceBySlug(slug, l);
  if (!s) notFound();
  const t = await getTranslations('services');
  const tc = await getTranslations('common');

  return (
    <>
      <div className="pt-32">
        <section className="wrap py-[clamp(48px,8vw,120px)]">
          <Reveal className="flex flex-col gap-5">
            <p className="eyebrow">{t('title')}</p>
            <h1 className="text-[clamp(40px,7vw,96px)] text-fg-strong">{s.name}</h1>
            {s.description && <p className="max-w-[48ch] text-[clamp(16px,1.5vw,20px)] leading-relaxed text-muted">{s.description}</p>}
          </Reveal>
        </section>

        {s.subServices.length > 0 && (
          <section className="wrap pb-[clamp(48px,7vw,100px)]">
            <Reveal className="mb-8">
              <p className="eyebrow">{t('included')}</p>
            </Reveal>
            <div className="grid gap-x-10 gap-y-8 border-t border-line pt-8 md:grid-cols-2">
              {s.subServices.map((ss) => (
                <Reveal key={ss.id}>
                  <h3 className="font-display text-xl font-bold text-fg-strong">{ss.name}</h3>
                  {ss.description && <p className="mt-2 text-sm leading-relaxed text-muted">{ss.description}</p>}
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {s.projects.length > 0 && (
          <section className="wrap pb-[clamp(72px,11vw,140px)]">
            <Reveal className="mb-8">
              <p className="eyebrow">{t('relatedWork')}</p>
            </Reveal>
            <Reveal>
              <div className="columns-1 gap-[clamp(16px,2vw,28px)] sm:columns-2 lg:columns-3">
                {s.projects.map((p) => (
                  <ProjectTile key={p.id} project={p} viewLabel={tc('viewCase')} />
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
