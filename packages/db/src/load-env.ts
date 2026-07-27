import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Prisma CLI / tsx run from packages/db do NOT auto-load the repo-root .env, so standalone
// scripts (e.g. seed) don't see DATABASE_URL/DIRECT_URL. Load it here as a side effect.
// No-op if the file is absent (e.g. CI, where env vars are provided directly). Existing
// process.env values (e.g. OWNER_PASSWORD passed on the command line) are never overwritten.
try {
  const content = readFileSync(resolve(process.cwd(), '../../.env'), 'utf8');
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
  // No .env file — rely on the real environment.
}
