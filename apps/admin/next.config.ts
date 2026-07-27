import path from 'path';
import { readFileSync } from 'node:fs';
import type { NextConfig } from 'next';

// Dev convenience: Next only auto-loads an app-local .env, not the monorepo-root one. Load the
// root .env here so server route handlers see DATABASE_URL/DIRECT_URL/JWT_SECRET/R2_* locally.
// In CI/production, env vars come from the host, so a missing file is a harmless no-op. Existing
// process.env values are never overwritten.
try {
  const content = readFileSync(path.join(__dirname, '../../.env'), 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {
  // No root .env — rely on the host's environment variables.
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@studioflow/core',
    '@studioflow/db',
    '@studioflow/shared',
    '@studioflow/types',
    '@studioflow/ui',
    '@studioflow/validation',
  ],
  // Prisma ships engine binaries — keep it external so it's require()'d at runtime, not bundled.
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
