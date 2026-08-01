import { z } from 'zod';
import { htmlSafe as safe, httpUrl as safeUrl } from './shared';

const heroConfig = z.object({
  // All optional: an empty/partial config falls back to the site's themed defaults.
  // `eyebrow` is special: an empty string is kept and means "hide the tagline" (an absent
  // key falls back to the designed default), so it must allow "" as well as real text.
  eyebrow: safe(200).optional(),
  headline: safe(200).optional(),
  subheadline: safe(500).optional(),
  ctaText: safe(60).optional(),
  ctaLink: safeUrl().optional(),
  backgroundMediaId: z.string().uuid().optional(),
});

const servicesConfig = z.object({
  title: safe(200).optional(),
  description: safe(500).optional(),
  maxItems: z.number().int().min(1).max(50).optional(),
});

const projectsConfig = z.object({
  title: safe(200).optional(),
  maxItems: z.number().int().min(1).max(50).optional(),
  featured: z.boolean().optional(),
});

const clientsConfig = z.object({
  title: safe(200).optional(),
  maxItems: z.number().int().min(1).max(50).optional(),
});

const statsConfig = z.object({
  title: safe(200).optional(),
  items: z
    .array(
      z.object({
        label: safe(100),
        value: safe(100),
      }),
    )
    .max(20),
});

const testimonialsConfig = z.object({
  title: safe(200).optional(),
  maxItems: z.number().int().min(1).max(50).optional(),
});

const faqConfig = z.object({
  title: safe(200).optional(),
  items: z
    .array(
      z.object({
        question: safe(300),
        answer: safe(2000),
      }),
    )
    .max(50),
});

const ctaConfig = z.object({
  headline: safe(200).optional(),
  subheadline: safe(500).optional(),
  buttonText: safe(60).optional(),
  buttonLink: safeUrl().optional(),
});

// Decorative sections: an optional heading override; their inner content is themed in code.
const beforeAfterConfig = z.object({
  title: safe(200).optional(),
});

const processConfig = z.object({
  title: safe(200).optional(),
});

export const homepageSectionTypeEnum = z.enum([
  'HERO',
  'SERVICES',
  'PROJECTS',
  'CLIENTS',
  'STATS',
  'TESTIMONIALS',
  'FAQ',
  'CTA',
  'BEFORE_AFTER',
  'PROCESS',
]);

const sectionConfigSchemas: Record<string, z.ZodType> = {
  HERO: heroConfig,
  SERVICES: servicesConfig,
  PROJECTS: projectsConfig,
  CLIENTS: clientsConfig,
  STATS: statsConfig,
  TESTIMONIALS: testimonialsConfig,
  FAQ: faqConfig,
  CTA: ctaConfig,
  BEFORE_AFTER: beforeAfterConfig,
  PROCESS: processConfig,
};

function getSectionConfigSchema(type: string): z.ZodType {
  const schema = sectionConfigSchemas[type];
  // Unknown types get a strict empty object (reject stray keys) rather than passthrough,
  // so nothing unvalidated (incl. raw HTML) can slip through under an unrecognised type.
  if (!schema) return z.object({}).strict();
  return schema;
}

export const createHomepageSectionSchema = z.object({
  type: homepageSectionTypeEnum,
  locale: z.enum(['en', 'ar']).optional(),
});

export const updateHomepageSectionSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
  version: z.number().int().positive(),
});

export function validateSectionConfig(
  type: string,
  config: Record<string, unknown>,
): { success: true; data: Record<string, unknown> } | { success: false; error: string } {
  const schema = getSectionConfigSchema(type);
  const result = schema.safeParse(config);
  if (result.success) return { success: true, data: result.data as Record<string, unknown> };
  return {
    success: false,
    error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
  };
}

export const homepageReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});
