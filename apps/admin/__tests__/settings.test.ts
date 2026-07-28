import { describe, it, expect } from 'vitest';

describe('GET /api/settings', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/settings/route');
    const request = new Request('http://localhost/api/settings');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/settings', () => {
  it('returns 401 without auth', async () => {
    const { PATCH } = await import('../app/api/settings/route');
    const request = new Request('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ siteName: 'Updated', version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing version', async () => {
    const { PATCH } = await import('../app/api/settings/route');
    const request = new Request('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ siteName: 'Updated' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for malformed body', async () => {
    const { PATCH } = await import('../app/api/settings/route');
    const request = new Request('http://localhost/api/settings', {
      method: 'PATCH',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });
});
