// ── Keyset pagination (FR-023, research §8) ──────────────────────────────

import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@studioflow/types';

export interface PageParams {
  cursor?: string;
  limit: number;
}

export interface PageMeta {
  cursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export function parsePageParams(searchParams: URLSearchParams): PageParams {
  const cursor = searchParams.get('cursor') ?? undefined;
  const rawLimit = searchParams.get('limit');
  const parsed = parseInt(rawLimit ?? '', 10);
  const limit = Math.min(
    Math.max(Number.isNaN(parsed) ? DEFAULT_PAGE_LIMIT : parsed, 1),
    MAX_PAGE_LIMIT,
  );
  return { cursor, limit };
}

export function buildPageMeta<T extends { createdAt: Date; id: string }>(
  items: T[],
  limit: number,
): PageMeta {
  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;
  const last = sliced[sliced.length - 1];
  const cursor = last ? `${last.createdAt.toISOString()}_${last.id}` : null;
  return { cursor, hasMore, limit };
}

export function buildPageResponse<T extends { createdAt: Date; id: string }>(
  items: T[],
  limit: number,
): Page<T> {
  const meta = buildPageMeta(items, limit);
  return { items: meta.hasMore ? items.slice(0, limit) : items, meta };
}

// ── Typed error envelope ─────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 422, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

// ── Transactional usage-count adjuster (FR-010, FR-011) ──────────────────

import type { Prisma } from '@prisma/client';

/**
 * Adjust a Media asset's usageCount inside a transaction. Decrements are
 * floored at 0 (guarded WHERE) so a double-unreference can never drive the
 * count negative and silently defeat delete-protection (FR-011).
 */
export async function adjustUsageCount(
  tx: Prisma.TransactionClient,
  mediaId: string,
  delta: number,
): Promise<void> {
  if (delta === 0) return;
  if (delta > 0) {
    await tx.media.update({
      where: { id: mediaId },
      data: { usageCount: { increment: delta } },
    });
  } else {
    // Only decrement when it stays >= 0; avoids negative usageCount.
    await tx.media.updateMany({
      where: { id: mediaId, usageCount: { gte: -delta } },
      data: { usageCount: { decrement: -delta } },
    });
  }
}
