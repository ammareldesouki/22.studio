import { z } from 'zod';

// Client reviews shown on the marketing site. Not localized — one `quote` string is shown
// as-is on both the EN and AR sites. Modeled on the lightweight Budget list (no SEO/slug).
export const createReviewSchema = z.object({
  quote: z.string().min(1).max(1000),
  authorName: z.string().min(1).max(120),
  order: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export const updateReviewSchema = z.object({
  quote: z.string().min(1).max(1000).optional(),
  authorName: z.string().min(1).max(120).optional(),
  order: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});
