import { describe, it, expect } from 'vitest';

describe('GET /api/health', () => {
  it('returns 200 with {"status":"ok"}', async () => {
    const { GET } = await import('../app/api/health/route');
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('sets Content-Type to application/json', async () => {
    const { GET } = await import('../app/api/health/route');
    const response = await GET();
    expect(response.headers.get('content-type')).toMatch(/^application\/json/);
  });
});
