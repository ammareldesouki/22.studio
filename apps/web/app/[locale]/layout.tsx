import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Montserrat, Open_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { routing } from '../i18n/routing';
import { Nav } from '../../components/nav';
import { Footer } from '../../components/footer';
import { Cursor } from '../../components/cursor';
import { SmoothScroll } from '../../components/smooth-scroll';
import '../globals.css';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--font-display', display: 'swap' });
const openSans = Open_Sans({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-body', display: 'swap' });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-arabic', display: 'swap' });

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://22studio.example';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = '22 Studio — Creative Video Studio';
  const description = 'We turn your brief into content people cannot scroll past.';
  return {
    metadataBase: new URL(BASE),
    title: { default: title, template: '%s' },
    description,
    alternates: { languages: { en: '/en', ar: '/ar' } },
    openGraph: { title, description, locale, type: 'website' },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={`${montserrat.variable} ${openSans.variable} ${plexArabic.variable}`}>
      <body>
        <div className="grain" aria-hidden="true" />
        <Cursor />
        <NextIntlClientProvider messages={messages}>
          <SmoothScroll>
            <Nav locale={locale} />
            <main>{children}</main>
            <Footer />
          </SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
