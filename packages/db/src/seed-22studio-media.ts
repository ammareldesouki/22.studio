import './load-env';
import { db } from './client';

// Attach real campaign videos (Vimeo) to their projects, and add the new "Kameel" project.
// Idempotent: re-uses existing media by URL and resets each project's media to the one video.

type L = 'en' | 'ar';
const slugFor = (base: string, locale: L) => (locale === 'ar' ? `${base}-ar` : base);

const VIDEOS = [
  { base: 'ananinja-riyadh', url: 'https://vimeo.com/1212350841' },
  { base: 'shoppinggate-travel', url: 'https://vimeo.com/1212971486' },
  { base: 'zoice-product', url: 'https://vimeo.com/1212954407' },
  { base: 'barq-gulf', url: 'https://vimeo.com/1212348383' },
  { base: 'celion-luxury', url: 'https://vimeo.com/1212351580' },
  { base: 'kameel-app', url: 'https://vimeo.com/1204871971' },
];

const KAMEEL = {
  clientBase: 'kameel',
  clientName: 'Kameel',
  projectBase: 'kameel-app',
  en: { title: 'Kameel App — AI Campaign', overview: 'AI-produced video campaign for the Kameel app.' },
  ar: { title: 'تطبيق كميل — حملة بالذكاء الاصطناعي', overview: 'حملة فيديو بالذكاء الاصطناعي لتطبيق كميل.' },
};

async function ensureMedia(url: string): Promise<string> {
  const existing = await db.media.findFirst({ where: { url }, select: { id: true } });
  if (existing) return existing.id;
  const created = await db.media.create({
    data: { type: 'VIMEO', r2Key: '', url, confirmed: true },
    select: { id: true },
  });
  return created.id;
}

async function main() {
  // 1) Create the Kameel client + project (both locales) if missing.
  for (const locale of ['en', 'ar'] as L[]) {
    const clientSlug = slugFor(KAMEEL.clientBase, locale);
    const client = await db.client.upsert({
      where: { slug_locale: { slug: clientSlug, locale } },
      update: { status: 'PUBLISHED', publishedAt: new Date() },
      create: { name: KAMEEL.clientName, slug: clientSlug, order: 6, status: 'PUBLISHED', publishedAt: new Date(), locale },
      select: { id: true },
    });
    const aiService = await db.service.findUnique({ where: { slug_locale: { slug: slugFor('ai-video', locale), locale } }, select: { id: true } });
    const projSlug = slugFor(KAMEEL.projectBase, locale);
    const content = KAMEEL[locale];
    const existing = await db.project.findUnique({ where: { slug_locale: { slug: projSlug, locale } }, select: { id: true } });
    const data = {
      title: content.title,
      overview: content.overview,
      featured: true,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      locale,
      clientId: client.id,
    };
    let projectId: string;
    if (existing) {
      await db.project.update({ where: { id: existing.id }, data });
      projectId = existing.id;
    } else {
      const created = await db.project.create({ data: { ...data, slug: projSlug }, select: { id: true } });
      projectId = created.id;
    }
    if (aiService) {
      await db.projectService.upsert({
        where: { projectId_serviceId: { projectId, serviceId: aiService.id } },
        update: {},
        create: { projectId, serviceId: aiService.id },
      });
    }
  }

  // 2) Attach each video to its project in both locales (cover = the video).
  let attached = 0;
  for (const v of VIDEOS) {
    const mediaId = await ensureMedia(v.url);
    for (const locale of ['en', 'ar'] as L[]) {
      const proj = await db.project.findUnique({ where: { slug_locale: { slug: slugFor(v.base, locale), locale } }, select: { id: true } });
      if (!proj) continue;
      await db.projectMedia.deleteMany({ where: { projectId: proj.id } });
      await db.projectMedia.create({ data: { projectId: proj.id, mediaId, type: 'VIDEO', order: 0 } });
      attached++;
    }
  }

  console.log(`Done. Videos attached to ${attached} project rows (EN+AR). Projects now: ${await db.project.count()}.`);
}

main().then(() => db.$disconnect()).catch((e) => {
  console.error(e);
  return db.$disconnect().finally(() => process.exit(1));
});
