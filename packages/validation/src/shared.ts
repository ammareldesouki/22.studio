import { z } from 'zod';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@studioflow/types';

/** Cursor for keyset pagination (ISO timestamp + id — FR-023, research §8). */
export const paginationCursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).optional().default(DEFAULT_PAGE_LIMIT),
});

/** UUID identifier. */
export const idSchema = z.string().uuid();

/** Embedded SEO metadata (used by every content type — Content Engine base). */
export const seoSchema = z
  .object({
    title: z.string().max(160).optional(),
    metaDescription: z.string().max(320).optional(),
    canonicalUrl: z.string().url().optional(),
    ogImage: z.string().uuid().optional(),
    twitterCard: z.enum(['summary', 'summary_large_image', 'app']).optional(),
    structuredData: z.record(z.unknown()).optional(),
    robots: z.string().optional(),
  })
  .optional();

/** Version field for optimistic concurrency (FR-025). */
export const versionSchema = z.number().int().positive();

// FR-019 / SC-006: CMS content is plain text — no raw-HTML editing path anywhere.
// Reject anything that looks like a tag, script, inline handler, javascript: URL, or
// HTML entity so a payload can never be stored and later rendered on the public site.
const HTML_RE = /<\s*\/?\s*[a-z!][^>]*>|<\s*script|javascript:|on\w+\s*=|&#?[a-z0-9]+;/i;

/** A bounded plain-text string that rejects raw HTML / scripts. */
export const htmlSafe = (max: number) =>
  z
    .string()
    .max(max)
    .refine((s) => !HTML_RE.test(s), { message: 'must not contain HTML or scripts' });

/** A URL restricted to http(s) — rejects javascript:, data:, and other script-capable schemes. */
export const httpUrl = () =>
  z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), { message: 'must be an http(s) URL' });
