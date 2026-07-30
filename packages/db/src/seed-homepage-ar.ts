import './load-env';
import { Prisma } from '@prisma/client';
import { db } from './client';

// Mirror the English homepage layout into Arabic so the AR homepage has sections to
// manage in the CMS. Copies each EN section's type, order, enabled state, and config
// into an AR row with the same slug (allowed now that slugs are unique per locale).
// Idempotent by (slug, locale): re-running syncs structure but never clobbers an AR
// config the owner has already customised.

async function main() {
  const enSections = await db.homepageSection.findMany({
    where: { locale: 'en' },
    orderBy: { order: 'asc' },
    select: { slug: true, type: true, enabled: true, order: true, config: true },
  });

  if (enSections.length === 0) {
    console.log('No English homepage sections found — seed the EN homepage first.');
    await db.$disconnect();
    return;
  }

  let created = 0;
  let synced = 0;
  for (const s of enSections) {
    const existing = await db.homepageSection.findUnique({
      where: { slug_locale: { slug: s.slug, locale: 'ar' } },
      select: { id: true },
    });
    if (existing) {
      // Keep structure in sync (type/order) but preserve any customised AR config/enabled.
      await db.homepageSection.update({
        where: { id: existing.id },
        data: { type: s.type, order: s.order },
      });
      synced++;
    } else {
      await db.homepageSection.create({
        data: {
          type: s.type,
          slug: s.slug,
          locale: 'ar',
          enabled: s.enabled,
          order: s.order,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          // Start from the EN config so nothing renders empty; translate the text in the CMS.
          config: (s.config as Prisma.InputJsonValue) ?? {},
        },
      });
      created++;
    }
  }

  console.log(`Arabic homepage layout ready — ${created} section(s) created, ${synced} kept in sync.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  return db.$disconnect().finally(() => process.exit(1));
});
