import { describe, it, expect } from 'vitest';

describe('POST /api/media/upload-intent', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/media/upload-intent/route');
    const request = new Request('http://localhost/api/media/upload-intent', {
      method: 'POST',
      body: JSON.stringify({ filename: 'test.jpg', contentType: 'image/jpeg', size: 1024 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for malformed body', async () => {
    const { POST } = await import('../app/api/media/upload-intent/route');
    const request = new Request('http://localhost/api/media/upload-intent', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  // Note: invalid content-type / oversized files are rejected by the service with 422
  // (per contracts/media.md), not by the zod wrapper. That path runs after the auth guard,
  // so it is covered by the core MediaService tests rather than these unauthenticated route tests.
});

describe('GET /api/media', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/media/route');
    const request = new Request('http://localhost/api/media');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe('GET /api/media/:id', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/media/[id]/route');
    const request = new Request('http://localhost/api/media/m1');
    const response = await GET(request, { params: Promise.resolve({ id: 'm1' }) });
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/media/:id', () => {
  it('returns 401 without auth', async () => {
    const { PATCH } = await import('../app/api/media/[id]/route');
    const request = new Request('http://localhost/api/media/m1', {
      method: 'PATCH',
      body: JSON.stringify({ alt: 'new alt', version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: 'm1' }) });
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/media/:id', () => {
  it('returns 401 without auth', async () => {
    const { DELETE } = await import('../app/api/media/[id]/route');
    const request = new Request('http://localhost/api/media/m1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'm1' }) });
    expect(response.status).toBe(401);
  });
});

describe('GET /api/folders', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/folders/route');
    const request = new Request('http://localhost/api/folders');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/folders', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/folders/route');
    const request = new Request('http://localhost/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name: 'Photos' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing name', async () => {
    const { POST } = await import('../app/api/folders/route');
    const request = new Request('http://localhost/api/folders', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/folders/:id', () => {
  it('returns 401 without auth', async () => {
    const { PATCH } = await import('../app/api/folders/[id]/route');
    const request = new Request('http://localhost/api/folders/f1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renamed' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: 'f1' }) });
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/folders/:id', () => {
  it('returns 401 without auth', async () => {
    const { DELETE } = await import('../app/api/folders/[id]/route');
    const request = new Request('http://localhost/api/folders/f1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'f1' }) });
    expect(response.status).toBe(401);
  });
});
