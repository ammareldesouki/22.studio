import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Montserrat, Open_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { publicContent } from '@studioflow/core/public';
import { routing } from '../i18n/routing';
import { Nav } from '../../components/nav';
import { Footer } from '../../components/footer';
import { Cursor } from '../../components/cursor';
import { SmoothScroll } from '../../components/smooth-scroll';
import { ThemeProvider, THEME_INIT_SCRIPT } from '../../components/theme';
import { Analytics } from '../../components/analytics';
import { resolveAnalytics } from '../../lib/analytics';
import '../globals.css';

// Refresh the shell (nav/footer read from CMS Settings) within a minute of an edit.
export const revalidate = 60;

// Turn the Settings social-links map into a render-ready list.
function socialList(links: Record<string, string>): { label: string; href: string }[] {
  return Object.entries(links)
    .filter(([, href]) => typeof href === 'string' && href.trim())
    .map(([key, href]) => ({ label: key.charAt(0).toUpperCase() + key.slice(1), href }));
}

const montserrat = Montserrat({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--font-display', display: 'swap' });
const openSans = Open_Sans({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-body', display: 'swap' });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-arabic', display: 'swap' });

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://22studio.example';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const settings = await publicContent.settings();
  const seo = (settings?.seoDefaults ?? {}) as { title?: string; metaDescription?: string };
  const title = seo.title?.trim() || `${settings?.siteName?.trim() || '22 Studio'} — Creative Video Studio`;
  const description = seo.metaDescription?.trim() || 'We turn your brief into content people cannot scroll past.';
  return {
    metadataBase: new URL(BASE),
    title: { default: title, template: '%s' },
    description,
    alternates: { languages: { en: '/en', ar: '/ar' } },
    openGraph: { title, description, locale, type: 'website' },
    ...(settings?.faviconUrl ? { icons: { icon: settings.faviconUrl } } : {}),
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

  // Nav + footer are driven by CMS Settings (social links, contact) — no hardcoded values.
  const settings = await publicContent.settings();
  const social = socialList(settings?.socialLinks ?? {});
  const email = settings?.contact?.email ?? null;
  const phone = settings?.contact?.phone ?? null;
  const siteName = settings?.siteName ?? undefined;
  const logoUrl = settings?.logoUrl ?? null;

  // Tracking runs site-wide (both locales, every route) — this layout is the only document shell.
  const analytics = resolveAnalytics(settings?.analyticsIds);

  return (
    <html lang={locale} dir={dir} data-theme="dark" suppressHydrationWarning className={`${montserrat.variable} ${openSans.variable} ${plexArabic.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <div className="grain" aria-hidden="true" />
        <ThemeProvider>
          <Cursor />
          <NextIntlClientProvider messages={messages}>
            <SmoothScroll>
              <Nav locale={locale} social={social} email={email} siteName={siteName} logoUrl={logoUrl} />
              <main>{children}</main>
              <Footer social={social} email={email} phone={phone} siteName={siteName} logoUrl={logoUrl} />
            </SmoothScroll>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics {...analytics} />
      </body>
    </html>
  );
}
