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

export const createServiceSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().optional().nullable(),
  iconMediaId: z.string().uuid().optional().nullable(),
  order: z.number().int().nonnegative().optional(),
  seo: seoSchema,
  locale: z.enum(['en', 'ar']).optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().nullable().optional(),
  iconMediaId: z.string().uuid().nullable().optional(),
  order: z.number().int().nonnegative().optional(),
  slug: z.string().max(500).optional(),
  seo: seoSchema,
  locale: z.enum(['en', 'ar']).optional(),
  version: z.number().int().positive(),
});

export const serviceStatusActionSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'archive', 'restore']),
  version: z.number().int().positive(),
});

export const createSubServiceSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().optional().nullable(),
  order: z.number().int().nonnegative().optional(),
});

export const updateSubServiceSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().nullable().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const serviceReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});
