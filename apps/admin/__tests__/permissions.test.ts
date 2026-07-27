import { describe, it, expect } from 'vitest';

describe('GET /api/permissions', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/permissions/route');
    const request = new Request('http://localhost/api/permissions');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
