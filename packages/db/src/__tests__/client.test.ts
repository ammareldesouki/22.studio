import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('@studioflow/db', () => {
  it('exports a db client singleton', async () => {
    const mod = await import('../client');
    expect(mod.db).toBeDefined();
    expect(typeof mod.db.$connect).toBe('function');
    expect(typeof mod.db.$disconnect).toBe('function');
  });

  // Integration tests — require a live DB. Skipped when DATABASE_URL is unset so
  // `pnpm test` stays green on a fresh clone (SC-003/FR-012).
  describe.skipIf(!process.env.DATABASE_URL)('connection with valid config', () => {
    let client: PrismaClient;

    beforeAll(() => {
      client = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_URL } },
      });
    });

    afterAll(async () => {
      await client.$disconnect();
    });

    it('connects with valid DATABASE_URL config', async () => {
      await expect(client.$connect()).resolves.toBeUndefined();
    });

    it('can run a query over the established connection', async () => {
      const rows = await client.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
      expect(rows[0]?.ok).toBe(1);
    });
  });
});
