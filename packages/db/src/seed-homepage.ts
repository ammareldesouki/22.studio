import './load-env';
import { db } from './client';

// The designed home layout, in order. Seeded with empty config so each section renders
// from the site's i18n defaults until the owner customises it in the CMS. Idempotent by slug.
// AR uses the same layout via the i18n fallback (no per-locale rows yet).
const SECTIONS = [
  'HERO',
  'CLIENTS',
  'PROJECTS',
  'BEFORE_AFTER',
  'SERVICES',
  'PROCESS',
  'STATS',
  'FAQ',
  'CTA',
] as const;

async function main() {
  for (let i = 0; i < SECTIONS.length; i++) {
    const type = SECTIONS[i]!;
    const slug = `home-${type.toLowerCase().replace(/_/g, '-')}`;
    await db.homepageSection.upsert({
      where: { slug_locale: { slug, locale: 'en' } },
      // Keep order/type in sync on re-run, but never clobber a customised config/enabled.
      update: { order: i, type },
      create: { slug, type, order: i, enabled: true, status: 'PUBLISHED', locale: 'en', config: {} },
    });
  }
  const total = await db.homepageSection.count();
  console.log(`Seeded ${SECTIONS.length} homepage sections (EN). Total sections now: ${total}`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    return db.$disconnect().finally(() => process.exit(1));
  });
