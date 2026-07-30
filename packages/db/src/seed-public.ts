import './load-env';
import { db } from './client';

// Demo public content for the 22 Studio site — clients, services, and projects in EN + AR,
// all PUBLISHED so the marketing site renders. Idempotent by slug. Owner can replace via the CMS.

type L = 'en' | 'ar';

const CLIENTS = [
  { base: 'nexus', en: 'NEXUS', ar: 'نكسوس', website: 'https://example.com' },
  { base: 'aura', en: 'AURA', ar: 'أورا', website: 'https://example.com' },
  { base: 'volt', en: 'VOLT', ar: 'فولت', website: 'https://example.com' },
  { base: 'meridian', en: 'MERIDIAN', ar: 'ميريديان', website: 'https://example.com' },
];

const SERVICES = [
  { base: 'editing', en: 'Editing', ar: 'المونتاج', enD: 'Story-first edits built to convert — ads, reels, product, long-form.', arD: 'مونتاج يبدأ من القصة ومبني على تحقيق النتائج — إعلانات وريلز ومحتوى المنتجات والمحتوى الطويل.' },
  { base: 'ai-visuals', en: 'AI Visuals', ar: 'مرئيات بالذكاء الاصطناعي', enD: 'AI-generated worlds and campaigns, shipped in days not weeks.', arD: 'عوالم وحملات مولّدة بالذكاء الاصطناعي، تُنجز في أيام لا أسابيع.' },
  { base: 'creative-direction', en: 'Creative Direction', ar: 'الإدارة الإبداعية', enD: 'The marketing brain behind every frame — concept to delivery.', arD: 'العقل التسويقي خلف كل لقطة — من الفكرة إلى التسليم.' },
];

const PROJECTS = [
  {
    base: 'nexus-launch', client: 'nexus', services: ['editing', 'creative-direction'], featured: true,
    en: { title: 'A launch film that moved a market', overview: 'NEXUS was entering a crowded category with a great product and zero attention. We gave them a film people finished — and remembered.', challenge: 'Launch loud in a category that ignores launches.', solution: 'One idea, cut to never let go — pacing, sound, and grade all aimed at the hook.', results: '4.2M views in 30 days. +38% sales lift on launch. Sold out in 48 hours.' },
    ar: { title: 'فيلم إطلاق حرّك سوقًا', overview: 'دخلت نكسوس فئة مزدحمة بمنتج رائع دون أي انتباه. صنعنا لهم فيلمًا أكمله الناس وتذكّروه.', challenge: 'إطلاق مدوٍّ في فئة تتجاهل الإطلاقات.', solution: 'فكرة واحدة، مونتاج لا يترك المشاهد — إيقاع وصوت وتدرّج لوني كلها تصبّ في الجاذبية.', results: '٤٫٢ مليون مشاهدة في ٣٠ يومًا. ارتفاع المبيعات ٣٨٪ عند الإطلاق. نفاد المخزون خلال ٤٨ ساعة.' },
  },
  {
    base: 'aura-reels', client: 'aura', services: ['editing'], featured: true,
    en: { title: 'Product reels, 4.2M views', overview: 'Short-form product reels engineered for the feed.', challenge: 'Turn a catalogue into content people share.', solution: 'A repeatable reel system: hook, product, payoff — cut tight.', results: '4.2M views and a sold-out first drop.' },
    ar: { title: 'ريلز منتجات، ٤٫٢ مليون مشاهدة', overview: 'ريلز قصيرة للمنتجات مصمّمة للـفيد.', challenge: 'تحويل الكتالوج إلى محتوى يشاركه الناس.', solution: 'نظام ريلز متكرّر: جذب، منتج، ذروة — مونتاج محكم.', results: '٤٫٢ مليون مشاهدة ونفاد أول إصدار.' },
  },
  {
    base: 'volt-ai', client: 'volt', services: ['ai-visuals', 'creative-direction'], featured: true,
    en: { title: 'An AI spot in 5 days', overview: 'A fully AI-generated campaign, concept to delivery in five days.', challenge: 'A cinematic spot with no shoot and no time.', solution: 'AI visuals directed like film — then edited for rhythm.', results: 'Launched in 5 days at a fraction of the cost.' },
    ar: { title: 'إعلان بالذكاء الاصطناعي في ٥ أيام', overview: 'حملة مولّدة بالكامل بالذكاء الاصطناعي، من الفكرة إلى التسليم في خمسة أيام.', challenge: 'إعلان سينمائي دون تصوير ودون وقت.', solution: 'مرئيات بالذكاء الاصطناعي بإخراج سينمائي — ثم مونتاج للإيقاع.', results: 'أُطلق في ٥ أيام بجزء بسيط من التكلفة.' },
  },
  {
    base: 'meridian-doc', client: 'meridian', services: ['editing', 'creative-direction'], featured: false,
    en: { title: 'A brand documentary', overview: 'A brand documentary that made an industry pay attention.', challenge: 'Say something true, at length, that still holds.', solution: 'Story structure first; every cut earns the next.', results: '+38% qualified pipeline after release.' },
    ar: { title: 'فيلم وثائقي للعلامة', overview: 'فيلم وثائقي جعل قطاعًا كاملًا ينتبه.', challenge: 'قول شيء صادق ومطوّل يبقى مشوّقًا.', solution: 'بنية القصة أولًا؛ كل لقطة تستحق التالية.', results: 'زيادة ٣٨٪ في الفرص المؤهّلة بعد الإطلاق.' },
  },
];

function slugFor(base: string, locale: L) {
  return locale === 'ar' ? `${base}-ar` : base;
}

async function upsertClient(base: string, name: string, website: string, locale: L, order: number) {
  const slug = slugFor(base, locale);
  return db.client.upsert({
    where: { slug_locale: { slug, locale } },
    update: { name, status: 'PUBLISHED', publishedAt: new Date(), locale },
    create: { name, slug, website, order, status: 'PUBLISHED', publishedAt: new Date(), locale },
    select: { id: true },
  });
}

async function upsertService(base: string, name: string, description: string, locale: L, order: number) {
  const slug = slugFor(base, locale);
  return db.service.upsert({
    where: { slug_locale: { slug, locale } },
    update: { name, description, status: 'PUBLISHED', publishedAt: new Date(), locale },
    create: { name, description, slug, order, status: 'PUBLISHED', publishedAt: new Date(), locale },
    select: { id: true },
  });
}

async function main() {
  for (const locale of ['en', 'ar'] as L[]) {
    // Clients
    const clientIds = new Map<string, string>();
    for (let i = 0; i < CLIENTS.length; i++) {
      const c = CLIENTS[i]!;
      const row = await upsertClient(c.base, c[locale], c.website, locale, i);
      clientIds.set(c.base, row.id);
    }
    // Services
    const serviceIds = new Map<string, string>();
    for (let i = 0; i < SERVICES.length; i++) {
      const s = SERVICES[i]!;
      const row = await upsertService(s.base, s[locale], locale === 'ar' ? s.arD : s.enD, locale, i);
      serviceIds.set(s.base, row.id);
    }
    // Projects (+ typed refs)
    for (const p of PROJECTS) {
      const slug = slugFor(p.base, locale);
      const content = p[locale];
      const existing = await db.project.findUnique({ where: { slug_locale: { slug, locale } }, select: { id: true } });
      const data = {
        title: content.title, overview: content.overview, challenge: content.challenge,
        solution: content.solution, results: content.results, featured: p.featured,
        status: 'PUBLISHED' as const, publishedAt: new Date(), locale,
        clientId: clientIds.get(p.client)!,
      };
      let projectId: string;
      if (existing) {
        await db.project.update({ where: { id: existing.id }, data });
        projectId = existing.id;
        await db.projectService.deleteMany({ where: { projectId } });
      } else {
        const created = await db.project.create({ data: { ...data, slug }, select: { id: true } });
        projectId = created.id;
      }
      for (const svc of p.services) {
        await db.projectService.create({ data: { projectId, serviceId: serviceIds.get(svc)! } });
      }
    }
  }
  console.log('Public demo content seeded (EN + AR).');
}

main().then(() => db.$disconnect());
