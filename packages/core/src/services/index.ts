import { db } from '@studioflow/db';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@studioflow/types';
import { slugify, createWithUniqueSlug, seoToColumns, columnsToSeo, applyTransition, shouldStampPublishedAt, isForeignKeyViolation } from '@studioflow/core/content-engine';
import type { StatusAction, Seo } from '@studioflow/core/content-engine';

async function assertMediaExists(iconMediaId: string | null | undefined): Promise<void> {
  if (!iconMediaId) return;
  const media = await db.media.findUnique({ where: { id: iconMediaId }, select: { id: true } });
  if (!media) throw new ServicesError(`Unknown icon media reference: ${iconMediaId}`, 'INVALID_REF', 400);
}

function mapSubService(row: { id: string; name: string; description: string | null; order: number }): SubServiceRecord {
  return { id: row.id, name: row.name, description: row.description, order: row.order };
}

export interface ServiceRecord {
  id: string;
  name: string;
  description: string | null;
  iconMediaId: string | null;
  order: number;
  status: string;
  slug: string;
  featured: boolean;
  seo: Seo;
  version: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  projectCount?: number;
  subServices?: SubServiceRecord[];
}

export interface SubServiceRecord {
  id: string;
  name: string;
  description: string | null;
  order: number;
}

function serviceSelect() {
  return {
    id: true,
    name: true,
    description: true,
    iconMediaId: true,
    order: true,
    status: true,
    slug: true,
    featured: true,
    seoTitle: true,
    seoMetaDescription: true,
    seoCanonicalUrl: true,
    seoOgImage: true,
    seoTwitterCard: true,
    seoStructuredData: true,
    seoRobots: true,
    version: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

function mapService(row: Record<string, unknown>): ServiceRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    iconMediaId: (row.iconMediaId as string) ?? null,
    order: row.order as number,
    status: row.status as string,
    slug: row.slug as string,
    featured: row.featured as boolean,
    seo: columnsToSeo(row as Parameters<typeof columnsToSeo>[0]),
    version: row.version as number,
    publishedAt: row.publishedAt ? (row.publishedAt as Date).toISOString() : null,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

export class ServicesService {
  async create(input: {
    name: string;
    description?: string | null;
    iconMediaId?: string | null;
    order?: number;
    seo?: Record<string, unknown>;
    createdById?: string;
  }): Promise<ServiceRecord> {
    const baseSlug = slugify(input.name);
    const seoData = seoToColumns(input.seo as never);

    await assertMediaExists(input.iconMediaId);

    return createWithUniqueSlug(baseSlug, async (slug) => {
      const service = await db.service.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          iconMediaId: input.iconMediaId ?? null,
          order: input.order ?? 0,
          slug,
          createdById: input.createdById ?? null,
          ...seoData,
        },
        select: serviceSelect(),
      });
      return mapService(service as unknown as Record<string, unknown>);
    });
  }

  async update(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      iconMediaId?: string | null;
      order?: number;
      slug?: string;
      seo?: Record<string, unknown>;
      version: number;
    },
  ): Promise<ServiceRecord> {
    const current = await db.service.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!current) throw new ServicesError('Service not found', 'NOT_FOUND', 404);

    const slug = input.slug ?? current.slug;
    if (input.slug !== undefined && input.slug !== current.slug) {
      const clash = await db.service.findFirst({
        where: { slug: input.slug, NOT: { id } },
        select: { id: true },
      });
      if (clash) throw new ServicesError('Slug already in use', 'SLUG_TAKEN', 409);
    }

    if ('iconMediaId' in input) {
      await assertMediaExists(input.iconMediaId);
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if ('description' in input) data.description = input.description ?? null;
    if ('iconMediaId' in input) data.iconMediaId = input.iconMediaId ?? null;
    if (input.order !== undefined) data.order = input.order;
    data.slug = slug;
    data.version = { increment: 1 };
    if (input.seo !== undefined) {
      Object.assign(data, seoToColumns(input.seo as never));
    }

    const { count } = await db.service.updateMany({
      where: { id, version: input.version },
      data: data as never,
    });
    if (count === 0) throw new ServicesError('Version conflict', 'VERSION_CONFLICT', 409);

    const updated = await db.service.findUniqueOrThrow({
      where: { id },
      select: serviceSelect(),
    });
    return mapService(updated as unknown as Record<string, unknown>);
  }

  async updateStatus(
    id: string,
    action: StatusAction,
    version: number,
  ): Promise<ServiceRecord> {
    const current = await db.service.findUnique({
      where: { id },
      select: { id: true, status: true, publishedAt: true },
    });
    if (!current) throw new ServicesError('Service not found', 'NOT_FOUND', 404);

    let nextStatus: string;
    try {
      nextStatus = applyTransition(current.status as never, action);
    } catch {
      throw new ServicesError(
        `Cannot '${action}' a service in ${current.status} state`,
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

    const { count } = await db.service.updateMany({
      where: { id, version },
      data: data as never,
    });
    if (count === 0) throw new ServicesError('Version conflict', 'VERSION_CONFLICT', 409);

    const updated = await db.service.findUniqueOrThrow({
      where: { id },
      select: serviceSelect(),
    });
    return mapService(updated as unknown as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    const service = await db.service.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!service) throw new ServicesError('Service not found', 'NOT_FOUND', 404);

    try {
      await db.service.delete({ where: { id } });
    } catch (e: unknown) {
      if (isForeignKeyViolation(e)) {
        throw new ServicesError(
          'Cannot delete service — it is referenced by one or more projects',
          'IN_USE',
          409,
        );
      }
      throw e;
    }
  }

  async reorder(orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return;
    const found = await db.service.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((s) => s.id));
    const missing = [...new Set(orderedIds)].filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new ServicesError(`Unknown service id(s): ${missing.join(', ')}`, 'INVALID_REF', 400);
    }
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.service.update({ where: { id }, data: { order: index } }),
      ),
    );
  }

  async list(params: { cursor?: string; limit?: number }) {
    const limit = Math.min(Math.max(params.limit ?? DEFAULT_PAGE_LIMIT, 1), MAX_PAGE_LIMIT);

    const items = await db.service.findMany({
      // `id` last keeps the keyset stable when services share order/name.
      orderBy: [{ order: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const sliced = hasMore ? items.slice(0, limit) : items;
    const last = sliced[sliced.length - 1];

    return {
      items: sliced.map((s) => mapService(s as unknown as Record<string, unknown>)),
      meta: { cursor: last ? last.id : null, hasMore, limit },
    };
  }

  async getById(id: string) {
    const service = await db.service.findUnique({
      where: { id },
      select: {
        ...serviceSelect(),
        subServices: { orderBy: { order: 'asc' }, select: { id: true, name: true, description: true, order: true } },
        _count: { select: { projects: true } },
      },
    });
    if (!service) return null;

    const { _count, subServices, ...base } = service;
    return {
      ...mapService(base as unknown as Record<string, unknown>),
      projectCount: _count.projects,
      subServices: subServices.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        order: s.order,
      })),
    };
  }

  // ── SubServices ────────────────────────────────────────────────────────

  async createSubService(serviceId: string, input: { name: string; description?: string | null; order?: number }): Promise<SubServiceRecord> {
    const svc = await db.service.findUnique({ where: { id: serviceId }, select: { id: true } });
    if (!svc) throw new ServicesError('Service not found', 'NOT_FOUND', 404);

    const created = await db.subService.create({
      data: {
        serviceId,
        name: input.name,
        description: input.description ?? null,
        order: input.order ?? 0,
      },
    });
    return mapSubService(created);
  }

  async updateSubService(id: string, input: { name?: string; description?: string | null; order?: number }): Promise<SubServiceRecord> {
    const current = await db.subService.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw new ServicesError('SubService not found', 'NOT_FOUND', 404);

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if ('description' in input) data.description = input.description ?? null;
    if (input.order !== undefined) data.order = input.order;

    const updated = await db.subService.update({ where: { id }, data: data as never });
    return mapSubService(updated);
  }

  async deleteSubService(id: string): Promise<void> {
    const current = await db.subService.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw new ServicesError('SubService not found', 'NOT_FOUND', 404);
    await db.subService.delete({ where: { id } });
  }
}

export class ServicesError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ServicesError';
  }
}

export const servicesService = new ServicesService();
