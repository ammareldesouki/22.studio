import { db } from '@studioflow/db';
import { slugify, createWithUniqueSlug } from '@studioflow/core/content-engine';

export interface HomepageSectionRecord {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  config: Record<string, unknown>;
  slug: string;
  locale: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

function mapSection(row: Record<string, unknown>): HomepageSectionRecord {
  return {
    id: row.id as string,
    type: row.type as string,
    enabled: row.enabled as boolean,
    order: row.order as number,
    config: (row.config as Record<string, unknown>) ?? {},
    slug: row.slug as string,
    locale: (row.locale as string) ?? 'en',
    version: row.version as number,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

export const HOMEPAGE_SECTION_TYPES = [
  'HERO',
  'SERVICES',
  'PROJECTS',
  'CLIENTS',
  'STATS',
  'TESTIMONIALS',
  'FAQ',
  'CTA',
  'BEFORE_AFTER',
  'PROCESS',
] as const;

export type HomepageSectionType = (typeof HOMEPAGE_SECTION_TYPES)[number];

export class HomepageService {
  async create(input: {
    type: HomepageSectionType;
    locale?: 'en' | 'ar';
    createdById?: string;
  }): Promise<HomepageSectionRecord> {
    const baseSlug = slugify(input.type);

    return createWithUniqueSlug(baseSlug, async (slug) => {
      const section = await db.homepageSection.create({
        data: {
          type: input.type,
          slug,
          locale: input.locale ?? 'en',
          createdById: input.createdById ?? null,
        },
      });
      return mapSection(section as unknown as Record<string, unknown>);
    });
  }

  async update(
    id: string,
    input: {
      enabled?: boolean;
      config?: Record<string, unknown>;
      version: number;
    },
  ): Promise<HomepageSectionRecord> {
    const current = await db.homepageSection.findUnique({
      where: { id },
      select: { id: true, type: true },
    });
    if (!current) throw new HomepageError('Section not found', 'NOT_FOUND', 404);

    const data: Record<string, unknown> = {};
    if (input.enabled !== undefined) data.enabled = input.enabled;
    if (input.config !== undefined) data.config = input.config as never;
    data.version = { increment: 1 };

    const { count } = await db.homepageSection.updateMany({
      where: { id, version: input.version },
      data: data as never,
    });
    if (count === 0) throw new HomepageError('Version conflict', 'VERSION_CONFLICT', 409);

    const updated = await db.homepageSection.findUniqueOrThrow({
      where: { id },
    });
    return mapSection(updated as unknown as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    const section = await db.homepageSection.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!section) throw new HomepageError('Section not found', 'NOT_FOUND', 404);
    await db.homepageSection.delete({ where: { id } });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return;
    const found = await db.homepageSection.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((s) => s.id));
    const missing = [...new Set(orderedIds)].filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new HomepageError(`Unknown section id(s): ${missing.join(', ')}`, 'INVALID_REF', 400);
    }
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.homepageSection.update({ where: { id }, data: { order: index } }),
      ),
    );
  }

  async list(params: { locale?: 'en' | 'ar' } = {}) {
    const sections = await db.homepageSection.findMany({
      ...(params.locale ? { where: { locale: params.locale } } : {}),
      // `createdAt` breaks ties so newly-created sections (all default order 0) stay stable.
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return sections.map((s) => mapSection(s as unknown as Record<string, unknown>));
  }

  async getById(id: string) {
    const section = await db.homepageSection.findUnique({ where: { id } });
    if (!section) return null;
    return mapSection(section as unknown as Record<string, unknown>);
  }
}

export class HomepageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'HomepageError';
  }
}

export const homepageService = new HomepageService();
