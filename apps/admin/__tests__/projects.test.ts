import { describe, it, expect } from 'vitest';

describe('GET /api/projects', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/projects/route');
    const request = new Request('http://localhost/api/projects');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/projects', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/projects/route');
    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing title', async () => {
    const { POST } = await import('../app/api/projects/route');
    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for malformed body', async () => {
    const { POST } = await import('../app/api/projects/route');
    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('GET /api/projects/:id', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/projects/[id]/route');
    const request = new Request('http://localhost/api/projects/p1');
    const response = await GET(request, { params: Promise.resolve({ id: 'p1' }) });
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/projects/:id', () => {
  it('returns 401 without auth', async () => {
    const { PATCH } = await import('../app/api/projects/[id]/route');
    const request = new Request('http://localhost/api/projects/p1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated', version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: 'p1' }) });
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing version', async () => {
    const { PATCH } = await import('../app/api/projects/[id]/route');
    const request = new Request('http://localhost/api/projects/p1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: 'p1' }) });
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/projects/:id', () => {
  it('returns 401 without auth', async () => {
    const { DELETE } = await import('../app/api/projects/[id]/route');
    const request = new Request('http://localhost/api/projects/p1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'p1' }) });
    expect(response.status).toBe(401);
  });
});

describe('POST /api/projects/:id/status', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/projects/[id]/status/route');
    const request = new Request('http://localhost/api/projects/p1/status', {
      method: 'POST',
      body: JSON.stringify({ action: 'publish', version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request, { params: Promise.resolve({ id: 'p1' }) });
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid action', async () => {
    const { POST } = await import('../app/api/projects/[id]/status/route');
    const request = new Request('http://localhost/api/projects/p1/status', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid', version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request, { params: Promise.resolve({ id: 'p1' }) });
    expect(response.status).toBe(400);
  });
});
