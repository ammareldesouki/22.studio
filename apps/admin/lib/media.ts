// Cloudflare R2 (S3-compatible object storage) — media asset configuration.
// Foundation phase: config-only. Validates env presence; makes NO network call (FR-019).
// Free egress + 10GB free storage; images transformed via Cloudflare, video via YouTube/Vimeo.

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Public base URL assets are served from (r2.dev URL or a custom domain). */
  publicUrl: string;
}

let cachedConfig: R2Config | null = null;

export function getR2Config(): R2Config {
  if (cachedConfig) return cachedConfig;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error(
      'Missing Cloudflare R2 configuration. Ensure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, '
        + 'R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_URL are set in your environment.',
    );
  }

  cachedConfig = { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
  return cachedConfig;
}

/** S3-compatible endpoint for R2 (used when the media feature is built in a later phase). */
export function r2Endpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}
