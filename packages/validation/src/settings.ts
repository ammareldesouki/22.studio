import { z } from 'zod';
import { htmlSafe, httpUrl } from './shared';

// Canonical tracking-id shapes. Shared so the admin's "this looks wrong" warning and the
// public site's render gate can never disagree: if the admin warns, the script won't render.
export const GA4_ID_RE = /^G-[A-Z0-9]{4,20}$/;
export const META_PIXEL_ID_RE = /^\d{5,20}$/;

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
  // Tracking ids are public, not secrets. Format is deliberately NOT enforced here — a typo'd
  // id must still save (the admin warns instead), and the public render gate refuses to emit
  // anything that fails GA4_ID_RE / META_PIXEL_ID_RE. htmlSafe still blocks HTML and js: URLs.
  analyticsIds: z
    .object({
      ga4MeasurementId: htmlSafe(50).optional(),
      ga4Enabled: z.boolean().optional(),
      metaPixelId: htmlSafe(50).optional(),
      metaPixelEnabled: z.boolean().optional(),
    })
    .optional(),
  contact: z
    .object({
      email: z.string().email().optional(),
      phone: htmlSafe(50).optional(),
      address: htmlSafe(500).optional(),
    })
    .optional(),
  version: z.number().int().positive(),
});
