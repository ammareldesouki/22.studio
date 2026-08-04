import './load-env';
import { db } from './client';

// Real 22 Studio content (EN + AR) — replaces the demo seed. Idempotent-ish: it clears
// existing clients/services/projects and re-creates the real set, all PUBLISHED.

type L = 'en' | 'ar';

const SERVICES = [
  {
    base: 'video-editing',
    en: 'Video Editing',
    ar: 'مونتاج الفيديو',
    enD: 'Story-first editing for ads, reels, product, and long-form content.',
    arD: 'مونتاج يبدأ من القصة للإعلانات والريلز ومحتوى المنتجات والمحتوى الطويل.',
  },
  {
    base: 'ai-video',
    en: 'AI Video Production',
    ar: 'إنتاج فيديو بالذكاء الاصطناعي',
    enD: 'Cinematic AI-generated video for brand campaigns, using tools like Seedance, Higgsfield, and Kling.',
    arD: 'فيديو سينمائي مُنتج بالذكاء الاصطناعي لحملات العلامات التجارية، باستخدام أدوات مثل Seedance وHiggsfield وKling.',
  },
  {
    base: 'motion-graphics',
    en: 'Motion Graphics',
    ar: 'الموشن جرافيك',
    enD: 'Animated graphics, titles, and brand motion.',
    arD: 'رسوم متحركة وعناوين وهوية حركية للعلامة.',
  },
  {
    base: 'creative-direction',
    en: 'Creative Direction',
    ar: 'الإخراج الإبداعي',
    enD: 'Concept and art direction that keeps every campaign on-brand.',
    arD: 'إخراج فني ومفاهيم تحافظ على هوية كل حملة.',
  },
];

const CLIENTS = [
  { base: 'ananinja', en: 'Ananinja', ar: 'Ananinja' },
  { base: 'barq', en: 'Barq', ar: 'Barq' },
  { base: 'celion', en: 'Célion', ar: 'Célion' },
  { base: 'shoppinggate', en: 'Shoppinggate', ar: 'Shoppinggate' },
  { base: 'zoice', en: 'Zoice Ice Tea', ar: 'Zoice Ice Tea' },
  { base: 'meraki', en: 'Meraki Design Build', ar: 'Meraki Design Build' },
];

const PROJECTS = [
  {
    base: 'ananinja-riyadh',
    client: 'ananinja',
    services: ['ai-video', 'creative-direction'],
    featured: true,
    en: { title: 'Ananinja — Ninja Over Riyadh', overview: 'Cinematic AI-generated flight sequences of a ninja delivery rider over Riyadh.' },
    ar: { title: 'أنانينجا — نينجا فوق الرياض', overview: 'مشاهد طيران سينمائية مُنتجة بالذكاء الاصطناعي لمندوب توصيل بشخصية نينجا فوق سماء الرياض.' },
  },
  {
    base: 'barq-gulf',
    client: 'barq',
    services: ['ai-video', 'creative-direction'],
    featured: true,
    en: { title: 'Barq — Voices of the Gulf', overview: 'Cinematic, multi-scenario, voiceover-driven AI campaign for a money transfer service, featuring Gulf and Saudi character personas.' },
    ar: { title: 'برق — أصوات الخليج', overview: 'حملة سينمائية متعددة المشاهد بصوت راوٍ، لخدمة تحويل أموال، بشخصيات خليجية سعودية.' },
  },
  {
    base: 'celion-luxury',
    client: 'celion',
    services: ['ai-video'],
    featured: true,
    en: { title: 'Célion — Luxury in Motion', overview: 'Luxury fashion campaign featuring a model, a Rolls-Royce, and an animal companion.' },
    ar: { title: 'سيليون — فخامة متحركة', overview: 'حملة أزياء فاخرة تضم عارضة أزياء وسيارة رولز رويس ورفيقًا حيوانيًا.' },
  },
  {
    base: 'shoppinggate-travel',
    client: 'shoppinggate',
    services: ['ai-video'],
    featured: true,
    en: { title: 'Shoppinggate — Suitcase to SUV', overview: 'Multi-scene AI ad for a travel booking brand, featuring models and a suitcase-to-SUV transformation concept.' },
    ar: { title: 'شوبينج جيت — من الحقيبة إلى السيارة', overview: 'إعلان متعدد المشاهد لعلامة تجارية لحجوزات السفر، يضم عارضين وفكرة تحول حقيبة سفر إلى سيارة SUV.' },
  },
  {
    base: 'zoice-product',
    client: 'zoice',
    services: ['ai-video'],
    featured: false,
    en: { title: 'Zoice Ice Tea — Product Film', overview: 'Product ad featuring a model, produced with AI video generation.' },
    ar: { title: 'زويس آيس تي — فيلم المنتج', overview: 'إعلان منتج يضم عارضة، مُنتج باستخدام تقنيات الفيديو بالذكاء الاصطناعي.' },
  },
  {
    base: 'meraki-content',
    client: 'meraki',
    services: ['creative-direction'],
    featured: false,
    en: { title: 'Meraki — Content Strategy', overview: 'Instagram content format and music strategy for a commercial interior fit-out brand in Riyadh.' },
    ar: { title: 'ميراكي — استراتيجية المحتوى', overview: 'استراتيجية شكل محتوى وموسيقى لحساب إنستجرام لعلامة تصميم وتنفيذ ديكورات داخلية تجارية في الرياض.' },
  },
];

const slugFor = (base: string, locale: L) => (locale === 'ar' ? `${base}-ar` : base);

async function main() {
  // Carry over an existing logo for Barq if the owner already attached one.
  const existingBarq = await db.client.findFirst({
    where: { name: { equals: 'barq', mode: 'insensitive' }, logoId: { not: null } },
    select: { logoId: true },
  });
  const barqLogoId = existingBarq?.logoId ?? null;

  // Clear existing content (join rows first for referential integrity).
  await db.projectMedia.deleteMany({});
  await db.relatedProject.deleteMany({});
  await db.projectService.deleteMany({});
  await db.testimonial.deleteMany({});
  await db.project.deleteMany({});
  await db.subService.deleteMany({});
  await db.client.deleteMany({});
  await db.service.deleteMany({});

  for (const locale of ['en', 'ar'] as L[]) {
    const clientIds = new Map<string, string>();
    for (let i = 0; i < CLIENTS.length; i++) {
      const c = CLIENTS[i]!;
      const row = await db.client.create({
        data: {
          name: c[locale],
          slug: slugFor(c.base, locale),
          order: i,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          locale,
          logoId: c.base === 'barq' ? barqLogoId : null,
        },
        select: { id: true },
      });
      clientIds.set(c.base, row.id);
    }

    const serviceIds = new Map<string, string>();
    for (let i = 0; i < SERVICES.length; i++) {
      const s = SERVICES[i]!;
      const row = await db.service.create({
        data: {
          name: s[locale],
          description: locale === 'ar' ? s.arD : s.enD,
          slug: slugFor(s.base, locale),
          order: i,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          locale,
        },
        select: { id: true },
      });
      serviceIds.set(s.base, row.id);
    }

    for (const p of PROJECTS) {
      const content = p[locale];
      const created = await db.project.create({
        data: {
          title: content.title,
          overview: content.overview,
          slug: slugFor(p.base, locale),
          featured: p.featured,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          locale,
          clientId: clientIds.get(p.client)!,
        },
        select: { id: true },
      });
      for (const svc of p.services) {
        await db.projectService.create({ data: { projectId: created.id, serviceId: serviceIds.get(svc)! } });
      }
    }
  }

  // Client reviews are not localized (one quote shown on both EN & AR), so seed them once,
  // only when the table is empty — a reseed must not duplicate them.
  if ((await db.review.count()) === 0) {
    await db.review.createMany({
      data: [
        { quote: 'Impressed by the professionalism and attention to detail.', authorName: 'Guy Hawkins', order: 0 },
        { quote: 'A seamless experience from start to finish. Highly recommend!', authorName: 'Karla Lynn', order: 1 },
        { quote: 'Reliable and trustworthy. Made my life so much easier!', authorName: 'Jane Cooper', order: 2 },
      ],
    });
  }

  const counts = {
    clients: await db.client.count(),
    services: await db.service.count(),
    projects: await db.project.count(),
  };
  console.log(`Loaded real 22 Studio content. Barq logo carried: ${barqLogoId ? 'yes' : 'no'}.`);
  console.log(`  clients=${counts.clients} services=${counts.services} projects=${counts.projects} (EN+AR)`);
}

main().then(() => db.$disconnect()).catch((e) => {
  console.error(e);
  return db.$disconnect().finally(() => process.exit(1));
});
