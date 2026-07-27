import { z } from 'zod';

const projectMediaTypeEnum = z.enum(['GALLERY', 'VIDEO', 'BEFORE_AFTER']);

const mediaRefSchema = z.object({
  mediaId: z.string().uuid(),
  type: projectMediaTypeEnum,
  order: z.number().int().nonnegative().optional().default(0),
});

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

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  overview: z.string().optional(),
  description: z.string().optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  results: z.string().optional(),
  externalLinks: z.array(z.unknown()).optional(),
  clientId: z.string().uuid().optional().nullable(),
  mediaRefs: z.array(mediaRefSchema).optional().default([]),
  serviceIds: z.array(z.string().uuid()).optional().default([]),
  relatedIds: z.array(z.string().uuid()).optional().default([]),
  seo: seoSchema,
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: z.string().max(500).optional(),
  overview: z.string().optional(),
  description: z.string().optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  results: z.string().optional(),
  externalLinks: z.array(z.unknown()).optional(),
  clientId: z.string().uuid().nullable().optional(),
  mediaRefs: z.array(mediaRefSchema).optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
  relatedIds: z.array(z.string().uuid()).optional(),
  seo: seoSchema,
  version: z.number().int().positive(),
});

export const statusActionSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'archive', 'restore']),
  version: z.number().int().positive(),
});
