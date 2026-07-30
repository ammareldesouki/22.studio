import './load-env';
import { Prisma } from '@prisma/client';
import { db } from './client';

// Real homepage copy + studio settings for 22 Studio. Updates the existing EN homepage
// sections (by slug) and the settings singleton. Safe to re-run.

const HOME: Record<string, Prisma.InputJsonObject> = {
  'home-hero': {
    headline: 'Cinematic AI video for brands',
    subheadline: '22 Studio is an AI-powered creative video studio — editing, AI video production, motion graphics, and creative direction for 100+ brands.',
    ctaText: 'Start a project',
  },
  'home-clients': { title: 'Trusted by 100+ brands' },
  'home-projects': { title: 'Selected work', featured: true, maxItems: 6 },
  'home-before-after': { title: 'From prompt to final frame' },
  'home-services': { title: 'What we do', description: 'From edit to AI production — full-service creative video.' },
  'home-process': { title: 'How we work' },
  'home-stats': {
    title: 'The work in numbers',
    items: [
      { label: 'Brands served', value: '100+' },
      { label: 'Core services', value: '4' },
      { label: 'Campaigns showcased', value: '6' },
    ],
  },
  'home-faq': {
    title: 'Questions, answered',
    items: [
      { question: 'What does 22 Studio do?', answer: 'We are an AI-powered creative video studio — video editing, AI video production, motion graphics, and creative direction for brands.' },
      { question: 'What is AI video production?', answer: 'Cinematic, photorealistic video generated with AI tools like Seedance, Higgsfield, and Kling — brand campaigns without a traditional shoot.' },
      { question: 'Who do you work with?', answer: 'Over 100 brands across fashion, streetwear, product, and lifestyle — including work for Gulf and Saudi markets.' },
      { question: 'Where are you based?', answer: 'We are based in Egypt and work with brands across the region and beyond.' },
      { question: 'How do I start a project?', answer: 'Share your brief through the contact page and we will come back with an approach and a timeline.' },
    ],
  },
  'home-cta': {
    headline: 'Let us make your next campaign',
    subheadline: 'Tell us about your brand — we will bring the craft and the AI.',
    buttonText: 'Start a project',
  },
};

async function main() {
  for (const [slug, config] of Object.entries(HOME)) {
    await db.homepageSection.updateMany({ where: { slug, locale: 'en' }, data: { config, enabled: true } });
  }

  const seoDefaults = {
    title: '22 Studio — AI-powered creative video studio',
    metaDescription: '22 Studio is a creative video studio offering video editing, AI video production, motion graphics, and creative direction for brands.',
  };
  const socialLinks = { instagram: 'https://instagram.com/_22visuals' };

  const existing = await db.settings.findFirst({ select: { id: true } });
  if (existing) {
    await db.settings.update({ where: { id: existing.id }, data: { siteName: '22 Studio', socialLinks, seoDefaults } });
  } else {
    await db.settings.create({ data: { siteName: '22 Studio', socialLinks, seoDefaults } });
  }

  console.log('Updated homepage copy + settings for 22 Studio.');
}

main().then(() => db.$disconnect()).catch((e) => {
  console.error(e);
  return db.$disconnect().finally(() => process.exit(1));
});
