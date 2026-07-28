import { setRequestLocale, getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { ServiceRow } from '../../../components/service-row';
import { Reveal } from '../../../components/reveal';
import { CtaBanner } from '../../../components/sections/cta-banner';

export const revalidate = 300;

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations('services');
  const services = await publicContent.listServices(l);

  return (
    <>
      <div className="pt-32">
        <section className="wrap py-[clamp(48px,8vw,110px)]">
          <Reveal className="flex flex-col gap-4">
            <p className="eyebrow">{t('title')}</p>
            <h1 className="text-[clamp(40px,7vw,100px)] text-white">{t('heading')}</h1>
            <p className="max-w-[40ch] text-[clamp(15px,1.3vw,18px)] text-muted">{t('sub')}</p>
          </Reveal>
        </section>
        <section className="wrap pb-[clamp(72px,11vw,140px)]">
          <div className="border-t border-line">
            {services.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.05}>
                <ServiceRow service={s} index={i} projectsLabel={t('projectCount', { count: s.projectCount })} />
              </Reveal>
            ))}
          </div>
        </section>
      </div>
      <CtaBanner />
    </>
  );
}
