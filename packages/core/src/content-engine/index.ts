import { ContentStatus, Prisma } from '@prisma/client';

// ── Status transitions (FR-001, FR-002) ───────────────────────────────────

export type StatusAction = 'publish' | 'unpublish' | 'archive' | 'restore';

const TRANSITIONS: Record<ContentStatus, Partial<Record<StatusAction, ContentStatus>>> = {
  DRAFT: { publish: 'PUBLISHED' },
  PUBLISHED: { unpublish: 'DRAFT', archive: 'ARCHIVED' },
  ARCHIVED: { restore: 'DRAFT' },
};

export function applyTransition(
  current: ContentStatus,
  action: StatusAction,
): ContentStatus {
  const next = TRANSITIONS[current]?.[action];
  if (!next) {
    throw new ContentEngineError(
      `Cannot transition from ${current} with action '${action}'`,
      'INVALID_TRANSITION',
    );
  }
  return next;
}

export function shouldStampPublishedAt(current: ContentStatus, next: ContentStatus): boolean {
  return current !== 'PUBLISHED' && next === 'PUBLISHED';
}

// ── Slug generation (FR-003) ─────────────────────────────────────────────

/**
 * Deterministic non-empty fallback for titles that transliterate to nothing
 * (e.g. Arabic/CJK). Same title → same base; different titles → different base.
 */
function fallbackBase(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return `item-${(h >>> 0).toString(36)}`;
}

/**
 * Produce a URL-safe slug. Diacritics are folded (é→e) via NFKD; characters
 * with no ASCII form (Arabic, CJK, …) are dropped, and if nothing survives we
 * fall back to a deterministic base so the slug is never empty (FR-003).
 */
export function slugify(title: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || fallbackBase(title);
}

/**
 * Best-effort pre-check that appends `-2`, `-3`, … until free. NOTE: this is a
 * pre-check only — it does NOT prevent a concurrent insert from taking the same
 * slug. Repositories MUST insert via `createWithUniqueSlug` so the DB unique
 * index (`@@unique([slug])`) race is handled by retry, not a raw 500.
 */
export async function ensureUniqueSlug(
  slug: string,
  checkSlug: (candidate: string) => Promise<boolean>,
): Promise<string> {
  if (!(await checkSlug(slug))) return slug;
  let suffix = 2;
  while (await checkSlug(`${slug}-${suffix}`)) {
    suffix++;
  }
  return `${slug}-${suffix}`;
}

/** True when the error is a Prisma unique-constraint violation (P2002). */
export function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}

/**
 * True when the error is a Prisma foreign-key constraint violation (P2003).
 * Duck-typed on `.code` so it recognises both real Prisma errors and errors
 * re-thrown across module/serialization boundaries.
 */
export function isForeignKeyViolation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && (e as { code?: unknown }).code === 'P2003';
}

/**
 * Race-safe create: runs `attempt(slug)`; if it hits a unique-slug violation,
 * retries with `-2`, `-3`, … up to `maxRetries` (FR-003 under concurrency).
 */
export async function createWithUniqueSlug<T>(
  baseSlug: string,
  attempt: (slug: string) => Promise<T>,
  maxRetries = 5,
): Promise<T> {
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? baseSlug : `${baseSlug}-${n}`;
    try {
      return await attempt(candidate);
    } catch (e) {
      if (isUniqueViolation(e) && n <= maxRetries) continue;
      throw e;
    }
  }
}

// ── SEO mapping (single source: nested object ↔ flat `seo*` columns) ───────

export interface Seo {
  title?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  twitterCard?: string;
  structuredData?: Prisma.InputJsonValue;
  robots?: string;
}

/** Map a nested SEO object to the flat `seo*` columns (Content Engine base). */
export function seoToColumns(seo?: Seo) {
  return {
    seoTitle: seo?.title ?? null,
    seoMetaDescription: seo?.metaDescription ?? null,
    seoCanonicalUrl: seo?.canonicalUrl ?? null,
    seoOgImage: seo?.ogImage ?? null,
    seoTwitterCard: seo?.twitterCard ?? null,
    seoStructuredData: seo?.structuredData ?? Prisma.JsonNull,
    seoRobots: seo?.robots ?? null,
  };
}

/** Map flat `seo*` columns back to a nested SEO object. */
export function columnsToSeo(row: {
  seoTitle: string | null;
  seoMetaDescription: string | null;
  seoCanonicalUrl: string | null;
  seoOgImage: string | null;
  seoTwitterCard: string | null;
  seoStructuredData: Prisma.JsonValue | null;
  seoRobots: string | null;
}): Seo {
  return {
    title: row.seoTitle ?? undefined,
    metaDescription: row.seoMetaDescription ?? undefined,
    canonicalUrl: row.seoCanonicalUrl ?? undefined,
    ogImage: row.seoOgImage ?? undefined,
    twitterCard: row.seoTwitterCard ?? undefined,
    structuredData: (row.seoStructuredData as Prisma.InputJsonValue) ?? undefined,
    robots: row.seoRobots ?? undefined,
  };
}

// ── Optimistic concurrency (FR-025) ──────────────────────────────────────

export class ContentEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ContentEngineError';
  }
}

/**
 * Optimistic concurrency (FR-025). Repositories MUST update with a **conditional
 * write** that includes the expected version, e.g.:
 *
 *   const { count } = await tx.project.updateMany({
 *     where: { id, version: expectedVersion },
 *     data: { ...fields, version: { increment: 1 } },
 *   });
 *   assertVersionedUpdate(count);
 *
 * A read-then-compare is racy and MUST NOT be used — passing the row count from
 * the conditional update here throws a Conflict when another writer won the race.
 */
export function assertVersionedUpdate(affectedCount: number): void {
  if (affectedCount === 0) {
    throw new ContentEngineError(
      'Version conflict: the record was modified by another write; reload and retry',
      'VERSION_CONFLICT',
    );
  }
}
