import { describe, it, expect } from 'vitest';

describe('GET /api/users', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/users/route');
    const request = new Request('http://localhost/api/users');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/users', () => {
  it('returns 400 for malformed body', async () => {
    const { POST } = await import('../app/api/users/route');
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for missing required fields', async () => {
    const { POST } = await import('../app/api/users/route');
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('POST /api/users/:id/password', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/users/[id]/password/route');
    const request = new Request('http://localhost/api/users/u1/password', {
      method: 'POST',
      body: JSON.stringify({ password: 'newpassword123' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request, { params: Promise.resolve({ id: 'u1' }) });
    expect(response.status).toBe(401);
  });
});
