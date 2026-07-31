import { getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { ServiceRow } from '../service-row';
import { Reveal } from '../reveal';

export async function Services({
  locale,
  config = {},
}: {
  locale: Locale;
  config?: { title?: string; maxItems?: number };
}) {
  const t = await getTranslations('sections');
  const ts = await getTranslations('services');
  let services = await publicContent.listServices(locale);
  if (services.length === 0) return null;
  if (config.maxItems && config.maxItems > 0) services = services.slice(0, config.maxItems);
  const heading = config.title?.trim() || t('servicesHeading');

  return (
    <section className="relative z-[2] bg-ink py-[clamp(44px,6vw,88px)]">
      <div className="wrap">
        <Reveal className="mb-[clamp(36px,5vw,64px)] flex flex-col gap-3.5">
          <p className="eyebrow">{t('servicesEyebrow')}</p>
          <h2 className="text-[clamp(32px,5.5vw,72px)] text-fg-strong">{heading}</h2>
        </Reveal>
        <div className="border-t border-line">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.05}>
              <ServiceRow service={s} index={i} projectsLabel={ts('projectCount', { count: s.projectCount })} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
