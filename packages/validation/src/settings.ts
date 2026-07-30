import { z } from 'zod';
import { htmlSafe, httpUrl } from './shared';

export const updateSettingsSchema = z.object({
  siteName: htmlSafe(200).optional(),
  logoId: z.string().uuid().nullable().optional(),
  faviconId: z.string().uuid().nullable().optional(),
  // Social links: plain values (URLs or handles) that must not smuggle HTML or javascript:.
  socialLinks: z.object({}).catchall(htmlSafe(500)).optional(),
  seoDefaults: z
    .object({
      title: htmlSafe(160).optional(),
      metaDescription: htmlSafe(320).optional(),
      canonicalUrl: httpUrl().optional(),
      ogImage: z.string().uuid().optional(),
      twitterCard: z.enum(['summary', 'summary_large_image', 'app']).optional(),
      structuredData: z.record(z.unknown()).optional(),
      robots: htmlSafe(200).optional(),
    })
    .optional(),
  analyticsIds: z.object({}).catchall(htmlSafe(500)).optional(),
  contact: z
    .object({
      email: z.string().email().optional(),
      phone: htmlSafe(50).optional(),
      address: htmlSafe(500).optional(),
    })
    .optional(),
  version: z.number().int().positive(),
});
