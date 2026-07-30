import { setRequestLocale } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { Hero } from '../../components/sections/hero';
import { ClientsWall } from '../../components/sections/clients-wall';
import { Featured } from '../../components/sections/featured';
import { BeforeAfter } from '../../components/sections/before-after';
import { Services } from '../../components/sections/services';
import { Process } from '../../components/sections/process';
import { Stats } from '../../components/sections/stats';
import { Faq } from '../../components/sections/faq';
import { CtaBanner } from '../../components/sections/cta-banner';
import { IntroOverlay } from '../../components/intro/intro-overlay';

export const revalidate = 300;

type Cfg = Record<string, unknown>;

// Render one CMS section by type. Unknown/TESTIMONIALS types render nothing (no component yet).
function renderSection(type: string, config: Cfg, locale: Locale, key: string) {
  switch (type) {
    case 'HERO':
      return <Hero key={key} config={config} />;
    case 'CLIENTS':
      return <ClientsWall key={key} locale={locale} config={config} />;
    case 'PROJECTS':
      return <Featured key={key} locale={locale} config={config} />;
    case 'BEFORE_AFTER':
      return <BeforeAfter key={key} config={config} />;
    case 'SERVICES':
      return <Services key={key} locale={locale} config={config} />;
    case 'PROCESS':
      return <Process key={key} config={config} />;
    case 'STATS':
      return <Stats key={key} config={config} />;
    case 'FAQ':
      return <Faq key={key} config={config} />;
    case 'CTA':
      return <CtaBanner key={key} config={config} />;
    default:
      return null;
  }
}

// The designed default layout, used when the CMS has no homepage sections configured yet.
function DefaultHome({ locale }: { locale: Locale }) {
  return (
    <>
      <Hero />
      <ClientsWall locale={locale} />
      <Featured locale={locale} />
      <BeforeAfter />
      <Services locale={locale} />
      <Process />
      <Stats />
      <Faq />
      <CtaBanner />
    </>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;

  const sections = await publicContent.homepageSections(l);

  const body =
    sections.length === 0 ? (
      <DefaultHome locale={l} />
    ) : (
      <>{sections.map((s) => renderSection(s.type, s.config, l, s.id))}</>
    );

  return (
    <>
      <IntroOverlay />
      {body}
    </>
  );
}
