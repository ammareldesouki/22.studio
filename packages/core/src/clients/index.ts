import { db } from '@studioflow/db';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@studioflow/types';
import { slugify, createWithUniqueSlug, seoToColumns, columnsToSeo, applyTransition, shouldStampPublishedAt, isForeignKeyViolation } from '@studioflow/core/content-engine';
import type { StatusAction, Seo } from '@studioflow/core/content-engine';

async function assertMediaExists(logoId: string | null | undefined, err: (msg: string) => Error): Promise<void> {
  if (!logoId) return;
  const media = await db.media.findUnique({ where: { id: logoId }, select: { id: true } });
  if (!media) throw err(`Unknown logo media reference: ${logoId}`);
}

export interface ClientRecord {
  id: string;
  name: string;
  logoId: string | null;
  website: string | null;
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
}

function clientSelect() {
  return {
    id: true,
    name: true,
    logoId: true,
    website: true,
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

function mapClient(row: Record<string, unknown>): ClientRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    logoId: (row.logoId as string) ?? null,
    website: (row.website as string) ?? null,
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

export class ClientsService {
  async create(input: {
    name: string;
    logoId?: string | null;
    website?: string | null;
    order?: number;
    seo?: Record<string, unknown>;
    createdById?: string;
  }): Promise<ClientRecord> {
    const baseSlug = slugify(input.name);
    const seoData = seoToColumns(input.seo as never);

    await assertMediaExists(input.logoId, (m) => new ClientsError(m, 'INVALID_REF', 400));

    return createWithUniqueSlug(baseSlug, async (slug) => {
      const client = await db.client.create({
        data: {
          name: input.name,
          logoId: input.logoId ?? null,
          website: input.website ?? null,
          order: input.order ?? 0,
          slug,
          createdById: input.createdById ?? null,
          ...seoData,
        },
        select: clientSelect(),
      });
      return mapClient(client as unknown as Record<string, unknown>);
    });
  }

  async update(
    id: string,
    input: {
      name?: string;
      logoId?: string | null;
      website?: string | null;
      order?: number;
      slug?: string;
      seo?: Record<string, unknown>;
      version: number;
    },
  ): Promise<ClientRecord> {
    const current = await db.client.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!current) throw new ClientsError('Client not found', 'NOT_FOUND', 404);

    const slug = input.slug ?? current.slug;
    if (input.slug !== undefined && input.slug !== current.slug) {
      const clash = await db.client.findFirst({
        where: { slug: input.slug, NOT: { id } },
        select: { id: true },
      });
      if (clash) throw new ClientsError('Slug already in use', 'SLUG_TAKEN', 409);
    }

    if ('logoId' in input) {
      await assertMediaExists(input.logoId, (m) => new ClientsError(m, 'INVALID_REF', 400));
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if ('logoId' in input) data.logoId = input.logoId ?? null;
    if ('website' in input) data.website = input.website ?? null;
    if (input.order !== undefined) data.order = input.order;
    data.slug = slug;
    data.version = { increment: 1 };
    if (input.seo !== undefined) {
      Object.assign(data, seoToColumns(input.seo as never));
    }

    const { count } = await db.client.updateMany({
      where: { id, version: input.version },
      data: data as never,
    });
    if (count === 0) throw new ClientsError('Version conflict', 'VERSION_CONFLICT', 409);

    const updated = await db.client.findUniqueOrThrow({
      where: { id },
      select: clientSelect(),
    });
    return mapClient(updated as unknown as Record<string, unknown>);
  }

  async updateStatus(
    id: string,
    action: StatusAction,
    version: number,
  ): Promise<ClientRecord> {
    const current = await db.client.findUnique({
      where: { id },
      select: { id: true, status: true, publishedAt: true },
    });
    if (!current) throw new ClientsError('Client not found', 'NOT_FOUND', 404);

    let nextStatus: string;
    try {
      nextStatus = applyTransition(current.status as never, action);
    } catch {
      throw new ClientsError(
        `Cannot '${action}' a client in ${current.status} state`,
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

    const { count } = await db.client.updateMany({
      where: { id, version },
      data: data as never,
    });
    if (count === 0) throw new ClientsError('Version conflict', 'VERSION_CONFLICT', 409);

    const updated = await db.client.findUniqueOrThrow({
      where: { id },
      select: clientSelect(),
    });
    return mapClient(updated as unknown as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    const client = await db.client.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!client) throw new ClientsError('Client not found', 'NOT_FOUND', 404);

    try {
      await db.client.delete({ where: { id } });
    } catch (e: unknown) {
      if (isForeignKeyViolation(e)) {
        throw new ClientsError(
          'Cannot delete client — it is referenced by one or more projects',
          'IN_USE',
          409,
        );
      }
      throw e;
    }
  }

  async reorder(orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return;
    const found = await db.client.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((c) => c.id));
    const missing = [...new Set(orderedIds)].filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new ClientsError(`Unknown client id(s): ${missing.join(', ')}`, 'INVALID_REF', 400);
    }
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.client.update({ where: { id }, data: { order: index } }),
      ),
    );
  }

  async list(params: { cursor?: string; limit?: number }) {
    const limit = Math.min(Math.max(params.limit ?? DEFAULT_PAGE_LIMIT, 1), MAX_PAGE_LIMIT);

    const items = await db.client.findMany({
      // `id` last keeps the keyset stable when clients share order/name.
      orderBy: [{ order: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const sliced = hasMore ? items.slice(0, limit) : items;
    const last = sliced[sliced.length - 1];

    return {
      items: sliced.map((c) => mapClient(c as unknown as Record<string, unknown>)),
      meta: { cursor: last ? last.id : null, hasMore, limit },
    };
  }

  async getById(id: string) {
    const client = await db.client.findUnique({
      where: { id },
      select: {
        ...clientSelect(),
        _count: { select: { projects: true } },
      },
    });
    if (!client) return null;

    const { _count, ...base } = client;
    return {
      ...mapClient(base as unknown as Record<string, unknown>),
      projectCount: _count.projects,
    };
  }
}

export class ClientsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ClientsError';
  }
}

export const clientsService = new ClientsService();
