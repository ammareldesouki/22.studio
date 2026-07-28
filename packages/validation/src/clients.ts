import { z } from 'zod';

const seoSchema = z
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

export const createClientSchema = z.object({
  name: z.string().min(1).max(300),
  logoId: z.string().uuid().optional().nullable(),
  website: z.string().url().optional().nullable(),
  order: z.number().int().nonnegative().optional(),
  seo: seoSchema,
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  logoId: z.string().uuid().nullable().optional(),
  website: z.string().url().nullable().optional(),
  order: z.number().int().nonnegative().optional(),
  slug: z.string().max(500).optional(),
  seo: seoSchema,
  version: z.number().int().positive(),
});

export const clientStatusActionSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'archive', 'restore']),
  version: z.number().int().positive(),
});

export const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});
