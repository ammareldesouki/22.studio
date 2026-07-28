import { z } from 'zod';

// FR-019 / SC-006: section config is plain text — never raw HTML. Reject anything that
// looks like a tag, script, inline handler, javascript: URL, or HTML entity so a payload
// can never be stored and later rendered on the public homepage (stored XSS).
const HTML_RE = /<\s*\/?\s*[a-z!][^>]*>|<\s*script|javascript:|on\w+\s*=|&#?[a-z0-9]+;/i;
const safe = (max: number) =>
  z
    .string()
    .max(max)
    .refine((s) => !HTML_RE.test(s), { message: 'must not contain HTML or scripts' });

// Links must be http(s) — reject javascript:, data:, and other script-capable schemes.
const safeUrl = () =>
  z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), { message: 'must be an http(s) URL' });

const heroConfig = z.object({
  headline: safe(200),
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
  headline: safe(200),
  subheadline: safe(500).optional(),
  buttonText: safe(60).optional(),
  buttonLink: safeUrl().optional(),
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
