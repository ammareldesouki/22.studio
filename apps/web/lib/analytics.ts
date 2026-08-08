import { GA4_ID_RE, META_PIXEL_ID_RE } from '@studioflow/validation/settings';

// Decides which tracking scripts the site is allowed to emit, from the CMS `analyticsIds` blob.
//
// This is the security boundary. Everything downstream interpolates these values straight into
// a <script> body and a URL, so we never escape — we allowlist: a value is returned only if it
// matches the strict id pattern, which permits nothing but [A-Z0-9-] / digits. Quotes, angle
// brackets and backslashes can't survive the gate, so there is no string an editor could type
// into the CMS that would break out of the script context.

export interface ResolvedAnalytics {
  ga4Id: string | null;
  metaPixelId: string | null;
}

function gated(raw: Record<string, unknown>, idKey: string, enabledKey: string, re: RegExp): string | null {
  // Strictly `true` — a stray "false"/"0" string from hand-edited JSON must not enable tracking.
  if (raw[enabledKey] !== true) return null;
  const id = raw[idKey];
  if (typeof id !== 'string') return null;
  const trimmed = id.trim();
  return re.test(trimmed) ? trimmed : null;
}

export function resolveAnalytics(raw: unknown): ResolvedAnalytics {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ga4Id: null, metaPixelId: null };
  const ids = raw as Record<string, unknown>;
  return {
    ga4Id: gated(ids, 'ga4MeasurementId', 'ga4Enabled', GA4_ID_RE),
    metaPixelId: gated(ids, 'metaPixelId', 'metaPixelEnabled', META_PIXEL_ID_RE),
  };
}
