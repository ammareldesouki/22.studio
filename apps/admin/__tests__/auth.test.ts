import { describe, it, expect } from 'vitest';

describe('POST /api/auth/login', () => {
  it('returns 400 for malformed body', async () => {
    const { POST } = await import('../app/api/auth/login/route');
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for missing email', async () => {
    const { POST } = await import('../app/api/auth/login/route');
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'test' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns 401 without refresh cookie', async () => {
    const { POST } = await import('../app/api/auth/refresh/route');
    const request = new Request('http://localhost/api/auth/refresh', { method: 'POST' });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/auth/logout/route');
    const request = new Request('http://localhost/api/auth/logout', { method: 'POST' });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
