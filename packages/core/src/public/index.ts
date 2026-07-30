import { db } from '@studioflow/db';
import { columnsToSeo, type Seo } from '@studioflow/core/content-engine';

// Public read layer for the marketing site. Unlike the admin services (which are the admin
// view and return every status), every read here hard-filters PUBLISHED content and the
// requested `locale`, and looks items up by slug. No auth — auth only guards the admin routes.

const PUBLISHED = 'PUBLISHED';
export type Locale = 'en' | 'ar';

export interface MediaRef {
  id: string;
  url: string;
  posterUrl: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  type: string;
  order: number;
}
export interface ProjectCard {
  id: string;
  title: string;
  slug: string;
  overview: string | null;
  featured: boolean;
  cover: MediaRef | null;
  client: { name: string; slug: string; logoUrl: string | null } | null;
  services: { name: string; slug: string }[];
  publishedAt: string | null;
}

const seoSelect = {
  seoTitle: true, seoMetaDescription: true, seoCanonicalUrl: true, seoOgImage: true,
  seoTwitterCard: true, seoStructuredData: true, seoRobots: true,
} as const;

const mediaRefSelect = {
  type: true, order: true,
  media: { select: { id: true, url: true, posterUrl: true, alt: true, width: true, height: true } },
} as const;

function toMediaRefs(rows: { type: string; order: number; media: { id: string; url: string; posterUrl: string | null; alt: string | null; width: number | null; height: number | null } }[]): MediaRef[] {
  return rows
    .map((r) => ({ id: r.media.id, url: r.media.url, posterUrl: r.media.posterUrl, alt: r.media.alt, width: r.media.width, height: r.media.height, type: r.type, order: r.order }))
    .sort((a, b) => a.order - b.order);
}

function iso(d: unknown): string | null {
  return d ? (d as Date).toISOString() : null;
}

export const publicContent = {
  async settings() {
    const s = await db.settings.findFirst();
    if (!s) return null;
    const imgIds = [s.logoId, s.faviconId].filter((x): x is string => !!x);
    const urlMap = new Map<string, string>();
    if (imgIds.length) {
      const media = await db.media.findMany({ where: { id: { in: imgIds } }, select: { id: true, url: true } });
      media.forEach((m) => urlMap.set(m.id, m.url));
    }
    return {
      siteName: s.siteName,
      logoUrl: s.logoId ? urlMap.get(s.logoId) ?? null : null,
      faviconUrl: s.faviconId ? urlMap.get(s.faviconId) ?? null : null,
      socialLinks: (s.socialLinks as Record<string, string>) ?? {},
      seoDefaults: (s.seoDefaults as Record<string, unknown>) ?? {},
      contact: (s.contact as Record<string, string>) ?? {},
    };
  },

  // Active budget/plan options for the contact form, localized (falls back to EN label).
  async listBudgets(locale: Locale = 'en'): Promise<{ id: string; label: string; amount: string | null }[]> {
    const rows = await db.budget.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, labelEn: true, labelAr: true, amount: true },
    });
    return rows.map((b) => ({
      id: b.id,
      label: locale === 'ar' ? b.labelAr?.trim() || b.labelEn : b.labelEn,
      amount: b.amount,
    }));
  },

  async homepageSections(locale: Locale = 'en') {
    const rows = await db.homepageSection.findMany({
      where: { enabled: true, locale },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, type: true, config: true, order: true },
    });

    // Resolve any backgroundMediaId (e.g. HERO) to a public URL the site can render.
    const bgIds = rows
      .map((r) => (r.config as Record<string, unknown> | null)?.backgroundMediaId)
      .filter((x): x is string => typeof x === 'string');
    const bgMap = new Map<string, string>();
    if (bgIds.length) {
      const media = await db.media.findMany({ where: { id: { in: bgIds } }, select: { id: true, url: true } });
      media.forEach((m) => bgMap.set(m.id, m.url));
    }

    return rows.map((r) => {
      const config = { ...((r.config as Record<string, unknown>) ?? {}) };
      if (typeof config.backgroundMediaId === 'string') {
        config.backgroundUrl = bgMap.get(config.backgroundMediaId) ?? null;
      }
      return { id: r.id, type: r.type as string, order: r.order, config };
    });
  },

  async listProjects(opts: { locale?: Locale; limit?: number; cursor?: string; featured?: boolean; clientSlug?: string; serviceSlug?: string } = {}): Promise<{ items: ProjectCard[]; nextCursor: string | null }> {
    const locale = opts.locale ?? 'en';
    const limit = Math.min(Math.max(opts.limit ?? 12, 1), 60);
    const where: Record<string, unknown> = { status: PUBLISHED, locale };
    if (opts.featured !== undefined) where.featured = opts.featured;
    if (opts.clientSlug) where.client = { slug: opts.clientSlug };
    if (opts.serviceSlug) where.services = { some: { service: { slug: opts.serviceSlug } } };

    const rows = await db.project.findMany({
      where: where as never,
      orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }, { id: 'asc' }],
      take: limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      select: {
        id: true, title: true, slug: true, overview: true, featured: true, publishedAt: true,
        client: { select: { name: true, slug: true, logoId: true } },
        services: { select: { service: { select: { name: true, slug: true } } } },
        media: { select: mediaRefSelect, orderBy: { order: 'asc' }, take: 1 },
      },
    });
    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;

    // Resolve client logos in one query.
    const logoIds = sliced.map((p) => p.client?.logoId).filter((x): x is string => !!x);
    const logoMap = new Map<string, string>();
    if (logoIds.length) {
      const logos = await db.media.findMany({ where: { id: { in: logoIds } }, select: { id: true, url: true } });
      logos.forEach((m) => logoMap.set(m.id, m.url));
    }

    const items: ProjectCard[] = sliced.map((p) => ({
      id: p.id, title: p.title, slug: p.slug, overview: p.overview, featured: p.featured,
      cover: toMediaRefs(p.media as never)[0] ?? null,
      client: p.client ? { name: p.client.name, slug: p.client.slug, logoUrl: p.client.logoId ? logoMap.get(p.client.logoId) ?? null : null } : null,
      services: p.services.map((s) => s.service),
      publishedAt: iso(p.publishedAt),
    }));
    return { items, nextCursor: hasMore ? (sliced.at(-1)?.id ?? null) : null };
  },

  async getProjectBySlug(slug: string, locale: Locale = 'en') {
    const p = await db.project.findFirst({
      where: { slug, status: PUBLISHED, locale },
      select: {
        id: true, title: true, slug: true, overview: true, description: true, challenge: true,
        solution: true, results: true, externalLinks: true, featured: true, publishedAt: true,
        ...seoSelect,
        client: { select: { name: true, slug: true, logoId: true } },
        services: { select: { service: { select: { name: true, slug: true } } } },
        media: { select: mediaRefSelect, orderBy: { order: 'asc' } },
        relatedProjects: { select: { relatedProject: { select: { title: true, slug: true, status: true } } } },
      },
    });
    if (!p) return null;
    const related = p.relatedProjects
      .map((r) => r.relatedProject)
      .filter((r) => r.status === PUBLISHED)
      .map((r) => ({ title: r.title, slug: r.slug }));
    return {
      id: p.id, title: p.title, slug: p.slug, overview: p.overview, description: p.description,
      challenge: p.challenge, solution: p.solution, results: p.results, externalLinks: p.externalLinks,
      featured: p.featured, publishedAt: iso(p.publishedAt),
      seo: columnsToSeo(p as Parameters<typeof columnsToSeo>[0]) as Seo,
      client: p.client ? { name: p.client.name, slug: p.client.slug } : null,
      services: p.services.map((s) => s.service),
      media: toMediaRefs(p.media as never),
      related,
    };
  },

  async listServices(locale: Locale = 'en') {
    const rows = await db.service.findMany({
      where: { status: PUBLISHED, locale },
      orderBy: [{ order: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, slug: true, description: true, iconMediaId: true, _count: { select: { projects: true } } },
    });
    return rows.map((s) => ({ id: s.id, name: s.name, slug: s.slug, description: s.description, projectCount: s._count.projects }));
  },

  async getServiceBySlug(slug: string, locale: Locale = 'en') {
    const s = await db.service.findFirst({
      where: { slug, status: PUBLISHED, locale },
      select: {
        id: true, name: true, slug: true, description: true, ...seoSelect,
        subServices: { orderBy: { order: 'asc' }, select: { id: true, name: true, description: true } },
      },
    });
    if (!s) return null;
    const projects = await this.listProjects({ locale, serviceSlug: slug, limit: 12 });
    return {
      id: s.id, name: s.name, slug: s.slug, description: s.description,
      seo: columnsToSeo(s as Parameters<typeof columnsToSeo>[0]) as Seo,
      subServices: s.subServices,
      projects: projects.items,
    };
  },

  async listClients(locale: Locale = 'en') {
    const rows = await db.client.findMany({
      where: { status: PUBLISHED, locale },
      orderBy: [{ order: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, slug: true, website: true, logoId: true, displayMode: true, _count: { select: { projects: true } } },
    });
    const logoIds = rows.map((r) => r.logoId).filter((x): x is string => !!x);
    const logos = logoIds.length
      ? await db.media.findMany({ where: { id: { in: logoIds } }, select: { id: true, url: true } })
      : [];
    const logoMap = new Map(logos.map((l) => [l.id, l.url]));
    return rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, website: c.website, logoUrl: c.logoId ? logoMap.get(c.logoId) ?? null : null, displayMode: c.displayMode, projectCount: c._count.projects }));
  },

  async getClientBySlug(slug: string, locale: Locale = 'en') {
    const c = await db.client.findFirst({
      where: { slug, status: PUBLISHED, locale },
      select: { id: true, name: true, slug: true, website: true, logoId: true },
    });
    if (!c) return null;
    let logoUrl: string | null = null;
    if (c.logoId) {
      const logo = await db.media.findUnique({ where: { id: c.logoId }, select: { url: true } });
      logoUrl = logo?.url ?? null;
    }
    const projects = await this.listProjects({ locale, clientSlug: slug, limit: 24 });
    return { id: c.id, name: c.name, slug: c.slug, website: c.website, logoUrl, projects: projects.items };
  },
};
