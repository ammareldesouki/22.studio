import { db } from '@studioflow/db';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@studioflow/types';
import { slugify, createWithUniqueSlug, seoToColumns, columnsToSeo, applyTransition, shouldStampPublishedAt } from '@studioflow/core/content-engine';
import type { StatusAction, Seo } from '@studioflow/core/content-engine';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MediaRefInput {
  mediaId: string;
  type: 'GALLERY' | 'VIDEO' | 'BEFORE_AFTER';
  order?: number;
}

export interface CreateProjectInput {
  title: string;
  overview?: string;
  description?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  externalLinks?: unknown[];
  clientId?: string | null;
  mediaRefs?: MediaRefInput[];
  serviceIds?: string[];
  relatedIds?: string[];
  seo?: Record<string, unknown>;
  locale?: 'en' | 'ar';
  featured?: boolean;
  order?: number;
  createdById?: string;
}

export interface UpdateProjectInput {
  title?: string;
  slug?: string;
  overview?: string;
  description?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  externalLinks?: unknown[];
  clientId?: string | null;
  mediaRefs?: MediaRefInput[];
  serviceIds?: string[];
  relatedIds?: string[];
  seo?: Record<string, unknown>;
  locale?: 'en' | 'ar';
  featured?: boolean;
  order?: number;
  version: number;
  updatedById?: string;
}

export interface ProjectRecord {
  id: string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  overview: string | null;
  description: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  externalLinks: unknown;
  clientId: string | null;
  order: number;
  seo: Seo;
  locale: string;
  version: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function projectSelect() {
  return {
    id: true,
    title: true,
    slug: true,
    status: true,
    featured: true,
    overview: true,
    description: true,
    challenge: true,
    solution: true,
    results: true,
    externalLinks: true,
    clientId: true,
    order: true,
    seoTitle: true,
    seoMetaDescription: true,
    seoCanonicalUrl: true,
    seoOgImage: true,
    seoTwitterCard: true,
    seoStructuredData: true,
    seoRobots: true,
    locale: true,
    version: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

function mapProject(row: Record<string, unknown>): ProjectRecord {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    status: row.status as string,
    featured: row.featured as boolean,
    overview: (row.overview as string) ?? null,
    description: (row.description as string) ?? null,
    challenge: (row.challenge as string) ?? null,
    solution: (row.solution as string) ?? null,
    results: (row.results as string) ?? null,
    externalLinks: row.externalLinks,
    clientId: (row.clientId as string) ?? null,
    order: (row.order as number) ?? 0,
    seo: columnsToSeo(row as Parameters<typeof columnsToSeo>[0]),
    locale: (row.locale as string) ?? 'en',
    version: row.version as number,
    publishedAt: row.publishedAt ? (row.publishedAt as Date).toISOString() : null,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

/** De-duplicate `{ mediaId, type }` refs so they never collide on the ProjectMedia PK. */
function dedupeMediaRefs(refs: MediaRefInput[]): MediaRefInput[] {
  const seen = new Set<string>();
  const out: MediaRefInput[] = [];
  for (const ref of refs) {
    const key = `${ref.mediaId}:${ref.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ref);
  }
  return out;
}

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

/**
 * Verify referenced media/services/related projects exist before we touch join rows,
 * so a bad id returns 400 instead of surfacing as a raw FK/500 mid-transaction.
 */
async function assertRefsExist(opts: {
  mediaIds?: string[];
  serviceIds?: string[];
  relatedIds?: string[];
}): Promise<void> {
  const checks: [string[], () => Promise<{ id: string }[]>, string][] = [
    [opts.mediaIds ?? [], () => db.media.findMany({ where: { id: { in: opts.mediaIds } }, select: { id: true } }), 'media'],
    [opts.serviceIds ?? [], () => db.service.findMany({ where: { id: { in: opts.serviceIds } }, select: { id: true } }), 'service'],
    [opts.relatedIds ?? [], () => db.project.findMany({ where: { id: { in: opts.relatedIds } }, select: { id: true } }), 'related project'],
  ];
  for (const [ids, query, label] of checks) {
    if (ids.length === 0) continue;
    const found = new Set((await query()).map((r) => r.id));
    const missing = [...new Set(ids)].filter((id) => !found.has(id));
    if (missing.length) {
      throw new ProjectsError(`Unknown ${label} reference(s): ${missing.join(', ')}`, 'INVALID_REF', 400);
    }
  }
}

// ── Service ─────────────────────────────────────────────────────────────────

export class ProjectsService {
  async create(input: CreateProjectInput): Promise<ProjectRecord> {
    const baseSlug = slugify(input.title);
    const mediaRefs = dedupeMediaRefs(input.mediaRefs ?? []);
    const serviceIds = [...new Set(input.serviceIds ?? [])];
    const relatedIds = [...new Set(input.relatedIds ?? [])];
    const seoData = seoToColumns(input.seo as never);

    await assertRefsExist({ mediaIds: mediaRefs.map((r) => r.mediaId), serviceIds, relatedIds });

    return createWithUniqueSlug(baseSlug, async (slug) => {
      return db.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            title: input.title,
            slug,
            overview: input.overview ?? null,
            description: input.description ?? null,
            challenge: input.challenge ?? null,
            solution: input.solution ?? null,
            results: input.results ?? null,
            externalLinks: (input.externalLinks as never) ?? [],
            clientId: input.clientId ?? null,
            locale: input.locale ?? 'en',
            featured: input.featured ?? false,
            order: input.order ?? 0,
            createdById: input.createdById ?? null,
            ...seoData,
            media: {
              create: mediaRefs.map((ref) => ({
                mediaId: ref.mediaId,
                type: ref.type as never,
                order: ref.order ?? 0,
              })),
            },
            services: {
              create: serviceIds.map((serviceId) => ({ serviceId })),
            },
            relatedProjects: {
              create: relatedIds.map((relatedProjectId) => ({ relatedProjectId })),
            },
          },
          select: projectSelect(),
        });

        for (const ref of mediaRefs) {
          await tx.media.update({
            where: { id: ref.mediaId },
            data: { usageCount: { increment: 1 } },
          });
        }

        return mapProject(project as unknown as Record<string, unknown>);
      });
    });
  }

  async update(
    id: string,
    input: UpdateProjectInput,
  ): Promise<ProjectRecord> {
    const current = await db.project.findUnique({
      where: { id },
      select: { id: true, slug: true, locale: true },
    });
    if (!current) throw new ProjectsError('Project not found', 'NOT_FOUND', 404);

    const slug = input.slug ?? current.slug;
    const targetLocale = input.locale ?? current.locale;
    if ((input.slug !== undefined && input.slug !== current.slug) || (input.locale !== undefined && input.locale !== current.locale)) {
      // Slug uniqueness is scoped per locale, so re-check against the target locale.
      const clash = await db.project.findFirst({
        where: { slug, locale: targetLocale, NOT: { id } },
        select: { id: true },
      });
      if (clash) throw new ProjectsError('Slug already in use', 'SLUG_TAKEN', 409);
    }

    const mediaRefs = input.mediaRefs !== undefined ? dedupeMediaRefs(input.mediaRefs) : undefined;
    const serviceIds = input.serviceIds !== undefined ? [...new Set(input.serviceIds)] : undefined;
    const relatedIds = input.relatedIds !== undefined ? [...new Set(input.relatedIds)] : undefined;
    await assertRefsExist({
      mediaIds: mediaRefs?.map((r) => r.mediaId),
      serviceIds,
      relatedIds,
    });

    const seoData = input.seo !== undefined ? seoToColumns(input.seo as never) : undefined;

    const basicData: Record<string, unknown> = {};
    if (input.title !== undefined) basicData.title = input.title;
    if (input.overview !== undefined) basicData.overview = input.overview;
    if (input.description !== undefined) basicData.description = input.description;
    if (input.challenge !== undefined) basicData.challenge = input.challenge;
    if (input.solution !== undefined) basicData.solution = input.solution;
    if (input.results !== undefined) basicData.results = input.results;
    if (input.externalLinks !== undefined) basicData.externalLinks = input.externalLinks as never;
    if (input.clientId !== undefined) basicData.clientId = input.clientId ?? null;
    if (input.locale !== undefined) basicData.locale = input.locale;
    if (input.featured !== undefined) basicData.featured = input.featured;
    if (input.order !== undefined) basicData.order = input.order;
    if (input.updatedById !== undefined) basicData.updatedById = input.updatedById ?? null;
    basicData.slug = slug;
    basicData.version = { increment: 1 };
    if (seoData) {
      Object.assign(basicData, seoData);
    }

    return db.$transaction(async (tx) => {
      const { count } = await tx.project.updateMany({
        where: { id, version: input.version },
        data: basicData as never,
      });
      if (count === 0) throw new ProjectsError('Version conflict', 'VERSION_CONFLICT', 409);

      if (mediaRefs !== undefined) {
        const oldMedia = await tx.projectMedia.findMany({
          where: { projectId: id },
          select: { mediaId: true },
        });
        for (const row of oldMedia) {
          await tx.media.updateMany({
            where: { id: row.mediaId, usageCount: { gte: 1 } },
            data: { usageCount: { decrement: 1 } },
          });
        }
        await tx.projectMedia.deleteMany({ where: { projectId: id } });
        for (const ref of mediaRefs) {
          await tx.projectMedia.create({
            data: { projectId: id, mediaId: ref.mediaId, type: ref.type as never, order: ref.order ?? 0 },
          });
          await tx.media.update({
            where: { id: ref.mediaId },
            data: { usageCount: { increment: 1 } },
          });
        }
      }

      if (serviceIds !== undefined) {
        await tx.projectService.deleteMany({ where: { projectId: id } });
        for (const serviceId of serviceIds) {
          await tx.projectService.create({ data: { projectId: id, serviceId } });
        }
      }

      if (relatedIds !== undefined) {
        // Only replace THIS project's outgoing relations. Deleting incoming rows
        // (relatedProjectId = id) would wipe other projects' curated related lists.
        await tx.relatedProject.deleteMany({ where: { projectId: id } });
        for (const relatedProjectId of relatedIds) {
          await tx.relatedProject.create({ data: { projectId: id, relatedProjectId } });
        }
      }

      const updated = await tx.project.findUniqueOrThrow({
        where: { id },
        select: projectSelect(),
      });
      return mapProject(updated as unknown as Record<string, unknown>);
    });
  }

  async updateStatus(
    id: string,
    action: StatusAction,
    version: number,
  ): Promise<ProjectRecord> {
    const current = await db.project.findUnique({
      where: { id },
      select: { id: true, status: true, publishedAt: true },
    });
    if (!current) throw new ProjectsError('Project not found', 'NOT_FOUND', 404);

    let nextStatus: string;
    try {
      nextStatus = applyTransition(current.status as never, action);
    } catch {
      throw new ProjectsError(
        `Cannot '${action}' a project in ${current.status} state`,
        'INVALID_TRANSITION',
        409,
      );
    }

    const data: Record<string, unknown> = {
      status: nextStatus as never,
      version: { increment: 1 },
    };
    if (shouldStampPublishedAt(current.status as never, nextStatus as never)) {
      data.publishedAt = new Date();
    }

    const { count } = await db.project.updateMany({
      where: { id, version },
      data: data as never,
    });
    if (count === 0) throw new ProjectsError('Version conflict', 'VERSION_CONFLICT', 409);

    const updated = await db.project.findUniqueOrThrow({
      where: { id },
      select: projectSelect(),
    });
    return mapProject(updated as unknown as Record<string, unknown>);
  }

  // Clone a project into a new DRAFT (slug auto-suffixed, same locale), copying its media
  // refs, service links and related projects. Meant to be edited next — e.g. switched to
  // Arabic and translated.
  async duplicate(id: string, createdById?: string): Promise<ProjectRecord> {
    const src = await this.getById(id);
    if (!src) throw new ProjectsError('Project not found', 'NOT_FOUND', 404);

    return this.create({
      title: `${src.title} (copy)`,
      overview: src.overview ?? undefined,
      description: src.description ?? undefined,
      challenge: src.challenge ?? undefined,
      solution: src.solution ?? undefined,
      results: src.results ?? undefined,
      externalLinks: Array.isArray(src.externalLinks) ? (src.externalLinks as unknown[]) : undefined,
      clientId: src.clientId,
      mediaRefs: src.media.map((m) => ({ mediaId: m.mediaId, type: m.type as MediaRefInput['type'], order: m.order })),
      serviceIds: src.services.map((s) => s.id),
      relatedIds: src.relatedProjects.map((r) => r.id),
      seo: src.seo as Record<string, unknown>,
      locale: src.locale as 'en' | 'ar',
      featured: src.featured,
      createdById,
    });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return;
    const found = await db.project.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((p) => p.id));
    const missing = [...new Set(orderedIds)].filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new ProjectsError(`Unknown project id(s): ${missing.join(', ')}`, 'INVALID_REF', 400);
    }
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.project.update({ where: { id }, data: { order: index } }),
      ),
    );
  }

  async delete(id: string): Promise<void> {
    const project = await db.project.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!project) throw new ProjectsError('Project not found', 'NOT_FOUND', 404);

    await db.$transaction(async (tx) => {
      const mediaRows = await tx.projectMedia.findMany({
        where: { projectId: id },
        select: { mediaId: true },
      });
      for (const row of mediaRows) {
        await tx.media.updateMany({
          where: { id: row.mediaId, usageCount: { gte: 1 } },
          data: { usageCount: { decrement: 1 } },
        });
      }
      await tx.projectMedia.deleteMany({ where: { projectId: id } });
      await tx.projectService.deleteMany({ where: { projectId: id } });
      await tx.relatedProject.deleteMany({
        where: { OR: [{ projectId: id }, { relatedProjectId: id }] },
      });
      await tx.project.delete({ where: { id } });
    });
  }

  async list(params: {
    cursor?: string;
    limit?: number;
    status?: string;
    clientId?: string;
    serviceId?: string;
    featured?: boolean;
    locale?: 'en' | 'ar';
  }) {
    const limit = Math.min(Math.max(params.limit ?? DEFAULT_PAGE_LIMIT, 1), MAX_PAGE_LIMIT);

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.clientId) where.clientId = params.clientId;
    if (params.serviceId) where.services = { some: { serviceId: params.serviceId } };
    if (params.featured !== undefined) where.featured = params.featured;
    if (params.locale) where.locale = params.locale;

    const items = await db.project.findMany({
      where: where as never,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const sliced = hasMore ? items.slice(0, limit) : items;
    const last = sliced[sliced.length - 1];

    return {
      items: sliced.map((p) => mapProject(p as unknown as Record<string, unknown>)),
      meta: { cursor: last ? last.id : null, hasMore, limit },
    };
  }

  async getById(id: string) {
    const project = await db.project.findUnique({
      where: { id },
      select: {
        ...projectSelect(),
        client: { select: { id: true, name: true } },
        media: {
          select: { mediaId: true, type: true, order: true },
          orderBy: { order: 'asc' },
        },
        services: {
          select: { service: { select: { id: true, name: true } } },
        },
        relatedProjects: {
          select: { relatedProject: { select: { id: true, title: true, slug: true } } },
        },
        relatedTo: {
          select: { project: { select: { id: true, title: true, slug: true } } },
        },
      },
    });
    if (!project) return null;

    const { media, services, relatedProjects, relatedTo, ...base } = project;
    return {
      ...mapProject(base as unknown as Record<string, unknown>),
      media: media.map((m) => ({ mediaId: m.mediaId, type: m.type, order: m.order })),
      services: services.map((s) => s.service),
      relatedProjects: dedupeById([
        ...relatedProjects.map((r) => r.relatedProject),
        ...relatedTo.map((r) => r.project),
      ]),
    };
  }
}

export class ProjectsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ProjectsError';
  }
}

export const projectsService = new ProjectsService();
