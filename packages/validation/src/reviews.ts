import { z } from 'zod';

// Client reviews shown on the marketing site. Not localized — one `quote` string is shown
// as-is on both the EN and AR sites. Modeled on the lightweight Budget list (no SEO/slug).
// `email` is private (from the public submission form) and never shown on the site.
export const createReviewSchema = z.object({
  quote: z.string().min(1).max(1000),
  authorName: z.string().min(1).max(120),
  email: z.string().email().max(200).optional().nullable(),
  order: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export const updateReviewSchema = z.object({
  quote: z.string().min(1).max(1000).optional(),
  authorName: z.string().min(1).max(120).optional(),
  email: z.string().email().max(200).nullable().optional(),
  pending: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

// Public submission from the marketing site's review form. `company` is a honeypot: real
// users leave it empty. `locale` is accepted but unused server-side (reviews aren't split).
export const publicReviewSubmitSchema = z.object({
  authorName: z.string().min(1).max(120),
  email: z.string().email().max(200),
  quote: z.string().min(1).max(1000),
  company: z.string().optional(),
  locale: z.string().max(5).optional(),
});
