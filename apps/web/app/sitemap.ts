import type { MetadataRoute } from 'next';
import { publicContent, type Locale } from '@studioflow/core/public';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://22studio.example';
const LOCALES: Locale[] = ['en', 'ar'];
const STATIC = ['', '/work', '/services', '/clients', '/about', '/contact'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const p of STATIC) {
      entries.push({ url: `${BASE}/${locale}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.7 });
    }
    try {
      const { items } = await publicContent.listProjects({ locale, limit: 200 });
      for (const pr of items) entries.push({ url: `${BASE}/${locale}/work/${pr.slug}`, changeFrequency: 'monthly', priority: 0.6 });
      for (const s of await publicContent.listServices(locale)) entries.push({ url: `${BASE}/${locale}/services/${s.slug}`, priority: 0.6 });
      for (const c of await publicContent.listClients(locale)) entries.push({ url: `${BASE}/${locale}/clients/${c.slug}`, priority: 0.5 });
    } catch {
      // If the DB is unreachable at build time, still emit the static routes.
    }
  }

  return entries;
}
