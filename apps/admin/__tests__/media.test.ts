import { describe, it, expect, vi } from 'vitest';

describe('Cloudflare R2 media config', () => {
  it('getR2Config returns config when env vars are set', async () => {
    vi.resetModules();
    process.env.R2_ACCOUNT_ID = 'acct-123';
    process.env.R2_ACCESS_KEY_ID = 'key-123';
    process.env.R2_SECRET_ACCESS_KEY = 'secret-123';
    process.env.R2_BUCKET = 'studioflow-media';
    process.env.R2_PUBLIC_URL = 'https://media.example.com';

    const { getR2Config } = await import('../lib/media');
    expect(getR2Config()).toEqual({
      accountId: 'acct-123',
      accessKeyId: 'key-123',
      secretAccessKey: 'secret-123',
      bucket: 'studioflow-media',
      publicUrl: 'https://media.example.com',
    });
  });

  it('getR2Config asserts config presence and throws when missing', async () => {
    vi.resetModules();
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
    delete process.env.R2_PUBLIC_URL;

    const mod = await import('../lib/media');
    expect(() => mod.getR2Config()).toThrow('Missing Cloudflare R2 configuration');
  });

  it('r2Endpoint builds the S3-compatible endpoint', async () => {
    const { r2Endpoint } = await import('../lib/media');
    expect(r2Endpoint('acct-123')).toBe('https://acct-123.r2.cloudflarestorage.com');
  });
});
