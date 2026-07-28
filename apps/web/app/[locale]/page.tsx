import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@studioflow/core/public';
import { Hero } from '../../components/sections/hero';
import { ClientsWall } from '../../components/sections/clients-wall';
import { Featured } from '../../components/sections/featured';
import { BeforeAfter } from '../../components/sections/before-after';
import { Services } from '../../components/sections/services';
import { Process } from '../../components/sections/process';
import { Stats } from '../../components/sections/stats';
import { Faq } from '../../components/sections/faq';
import { CtaBanner } from '../../components/sections/cta-banner';

export const revalidate = 300;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;

  return (
    <>
      <Hero />
      <ClientsWall locale={l} />
      <Featured locale={l} />
      <BeforeAfter />
      <Services locale={l} />
      <Process />
      <Stats />
      <Faq />
      <CtaBanner />
    </>
  );
}
