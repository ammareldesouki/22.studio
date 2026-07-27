import { describe, it, expect } from 'vitest';

describe('GET /api/roles', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/roles/route');
    const request = new Request('http://localhost/api/roles');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/roles', () => {
  it('returns 400 for malformed body', async () => {
    const { POST } = await import('../app/api/roles/route');
    const request = new Request('http://localhost/api/roles', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/roles/:id', () => {
  it('returns 401 without auth', async () => {
    const { DELETE } = await import('../app/api/roles/[id]/route');
    const request = new Request('http://localhost/api/roles/r1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'r1' }) });
    expect(response.status).toBe(401);
  });
});
