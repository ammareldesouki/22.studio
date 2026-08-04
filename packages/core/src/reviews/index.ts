import { db } from '@studioflow/db';

// CRUD for client reviews shown on the marketing site. Like Budgets this is a light,
// non-localized list — no publish workflow, SEO, or versioning — just an ordered,
// toggleable set. One `quote` string is shown as-is on both the EN and AR sites.

export interface ReviewRecord {
  id: string;
  quote: string;
  authorName: string;
  email: string | null;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const SELECT = {
  id: true,
  quote: true,
  authorName: true,
  email: true,
  order: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

function map(row: Record<string, unknown>): ReviewRecord {
  return {
    id: row.id as string,
    quote: row.quote as string,
    authorName: row.authorName as string,
    email: (row.email as string) ?? null,
    order: row.order as number,
    active: row.active as boolean,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

export class ReviewsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ReviewsError';
  }
}

export class ReviewsService {
  // Admin view — every review, ordered.
  async list(): Promise<ReviewRecord[]> {
    const rows = await db.review.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], select: SELECT });
    return rows.map((r) => map(r as unknown as Record<string, unknown>));
  }

  // Public view — only active reviews, ordered.
  async listActive(): Promise<ReviewRecord[]> {
    const rows = await db.review.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: SELECT,
    });
    return rows.map((r) => map(r as unknown as Record<string, unknown>));
  }

  async getById(id: string): Promise<ReviewRecord | null> {
    const row = await db.review.findUnique({ where: { id }, select: SELECT });
    return row ? map(row as unknown as Record<string, unknown>) : null;
  }

  async create(input: {
    quote: string;
    authorName: string;
    email?: string | null;
    order?: number;
    active?: boolean;
  }): Promise<ReviewRecord> {
    const row = await db.review.create({
      data: {
        quote: input.quote,
        authorName: input.authorName,
        email: input.email ?? null,
        order: input.order ?? 0,
        active: input.active ?? true,
      },
      select: SELECT,
    });
    return map(row as unknown as Record<string, unknown>);
  }

  async update(
    id: string,
    input: { quote?: string; authorName?: string; email?: string | null; order?: number; active?: boolean },
  ): Promise<ReviewRecord> {
    const existing = await db.review.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new ReviewsError('Review not found', 'NOT_FOUND', 404);

    const data: Record<string, unknown> = {};
    if (input.quote !== undefined) data.quote = input.quote;
    if (input.authorName !== undefined) data.authorName = input.authorName;
    if ('email' in input) data.email = input.email ?? null;
    if (input.order !== undefined) data.order = input.order;
    if (input.active !== undefined) data.active = input.active;

    const row = await db.review.update({ where: { id }, data: data as never, select: SELECT });
    return map(row as unknown as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    const existing = await db.review.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new ReviewsError('Review not found', 'NOT_FOUND', 404);
    await db.review.delete({ where: { id } });
  }
}

export const reviewsService = new ReviewsService();
