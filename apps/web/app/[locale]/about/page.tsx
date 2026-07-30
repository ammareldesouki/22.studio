import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Reveal } from '../../../components/reveal';
import { CtaBanner } from '../../../components/sections/cta-banner';

export const revalidate = 300;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  return (
    <>
      <div className="pt-32">
        <section className="wrap py-[clamp(48px,8vw,120px)]">
          <Reveal className="flex flex-col gap-4">
            <p className="eyebrow">{t('title')}</p>
            <h1 className="max-w-[16ch] text-[clamp(40px,7.5vw,108px)] text-fg-strong">{t('heading')}</h1>
          </Reveal>
        </section>

        <section className="wrap grid gap-x-16 gap-y-14 pb-[clamp(72px,11vw,160px)] md:grid-cols-2">
          <Reveal>
            <p className="eyebrow">{t('mission')}</p>
            <p className="mt-5 font-display text-[clamp(22px,2.6vw,36px)] font-medium leading-[1.25] tracking-tight text-fg-strong">{t('missionBody')}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="eyebrow">{t('vision')}</p>
            <p className="mt-5 font-display text-[clamp(22px,2.6vw,36px)] font-medium leading-[1.25] tracking-tight text-fg-strong">{t('visionBody')}</p>
          </Reveal>
        </section>
      </div>
      <CtaBanner />
    </>
  );
}
