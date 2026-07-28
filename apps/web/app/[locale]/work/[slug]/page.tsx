import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { Link } from '../../../i18n/navigation';
import { Reveal } from '../../../../components/reveal';
import { poster } from '../../../../lib/poster';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await publicContent.getProjectBySlug(slug, locale as Locale);
  if (!p) return {};
  return {
    title: `${p.seo.title || p.title} — 22 Studio`,
    description: p.seo.metaDescription || p.overview || undefined,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const p = await publicContent.getProjectBySlug(slug, l);
  if (!p) notFound();
  const t = await getTranslations('project');
  const year = p.publishedAt ? new Date(p.publishedAt).getFullYear() : null;
  const cover = p.media[0];
  const gallery = p.media.length > 0 ? p.media : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    ...(p.overview ? { description: p.overview } : {}),
    creator: { '@type': 'Organization', name: '22 Studio' },
    ...(p.client ? { about: p.client.name } : {}),
    ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Cover */}
      <header className="relative flex min-h-[86svh] flex-col justify-end overflow-hidden pb-[clamp(40px,6vw,72px)]">
        <div className="absolute inset-0 -z-20" style={cover ? undefined : { background: poster(p.slug) }}>
          {cover && <Image src={cover.url} alt={cover.alt || p.title} fill sizes="100vw" className="object-cover" priority />}
        </div>
        <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(180deg, rgba(13,13,15,0.5), transparent 40%, rgba(13,13,15,0.92))' }} />
        <div className="wrap">
          <p className="mb-5 flex flex-wrap gap-4 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-red">
            {p.client && <span className="text-white">{p.client.name}</span>}
            {year && <span className="text-white">{year}</span>}
          </p>
          <h1 className="text-[clamp(40px,7.4vw,110px)] text-white">{p.title}</h1>
          {p.overview && <p className="mt-6 max-w-[46ch] text-[clamp(16px,1.5vw,20px)] leading-relaxed text-muted">{p.overview}</p>}
        </div>
      </header>

      {/* Meta rail */}
      <section className="border-y border-line bg-ink-deep">
        <div className="wrap grid grid-cols-2 gap-6 py-8 md:grid-cols-3">
          {p.client && <Meta k={t('client')} v={p.client.name} />}
          {year && <Meta k={t('year')} v={String(year)} />}
          {p.services.length > 0 && <Meta k={t('services')} v={p.services.map((s) => s.name).join(' · ')} />}
        </div>
      </section>

      {/* Challenge / Solution / Results */}
      <section className="wrap py-[clamp(64px,9vw,140px)]">
        <div className="grid gap-[clamp(40px,6vw,90px)] md:grid-cols-2">
          {p.challenge && <Block eyebrow={t('challenge')}>{p.challenge}</Block>}
          {p.solution && <Block eyebrow={t('solution')}>{p.solution}</Block>}
        </div>
        {p.results && (
          <Reveal className="mt-[clamp(40px,5vw,72px)] border-t border-line pt-[clamp(32px,4vw,56px)]">
            <p className="eyebrow">{t('results')}</p>
            <p className="mt-4 max-w-[24ch] font-display text-[clamp(28px,4vw,56px)] font-medium leading-[1.15] tracking-tight text-white">{p.results}</p>
          </Reveal>
        )}
      </section>

      {/* Gallery */}
      <section className="wrap pb-[clamp(64px,9vw,140px)]">
        <div className="columns-1 gap-[clamp(16px,2vw,28px)] md:columns-2">
          {(gallery ?? [0, 1, 2, 3]).map((m, i) => {
            const hasImg = typeof m === 'object';
            return (
              <Reveal key={i} className="mb-[clamp(16px,2vw,28px)] break-inside-avoid">
                <div
                  className="relative overflow-hidden bg-card"
                  style={{ aspectRatio: i % 2 ? '4 / 3' : '4 / 5', background: hasImg ? undefined : poster(p.slug + i) }}
                >
                  {hasImg && <Image src={m.url} alt={m.alt || p.title} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Related */}
      {p.related.length > 0 && (
        <section className="wrap pb-[clamp(56px,8vw,120px)]">
          <Reveal className="mb-6">
            <p className="eyebrow">{t('related')}</p>
          </Reveal>
          <div className="grid gap-[clamp(16px,2vw,28px)] md:grid-cols-2">
            {p.related.map((r) => (
              <Link key={r.slug} href={`/work/${r.slug}`} data-cursor={t('next')} className="group relative block aspect-[16/10] overflow-hidden bg-card">
                <div className="absolute inset-0 transition-transform duration-[1100ms] ease-expo group-hover:scale-105" style={{ background: poster(r.slug) }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,12,0.86))' }} />
                <div className="absolute inset-x-0 bottom-0 p-[clamp(20px,2vw,32px)]">
                  <h3 className="text-[clamp(20px,2.2vw,30px)] text-white">{r.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="label">{k}</dt>
      <dd className="mt-2 font-display text-[clamp(15px,1.3vw,18px)] font-semibold text-white">{v}</dd>
    </div>
  );
}

function Block({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <p className="eyebrow">{eyebrow}</p>
      <p className="mt-4 text-[clamp(16px,1.4vw,19px)] leading-relaxed text-muted">{children}</p>
    </Reveal>
  );
}
