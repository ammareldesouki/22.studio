import { describe, it, expect } from 'vitest';

describe('GET /api/clients', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/clients/route');
    const request = new Request('http://localhost/api/clients');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/clients', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/clients/route');
    const request = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Client' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing name', async () => {
    const { POST } = await import('../app/api/clients/route');
    const request = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for malformed body', async () => {
    const { POST } = await import('../app/api/clients/route');
    const request = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('GET /api/clients/:id', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/clients/[id]/route');
    const request = new Request('http://localhost/api/clients/c1');
    const response = await GET(request, { params: Promise.resolve({ id: 'c1' }) });
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/clients/:id', () => {
  it('returns 401 without auth', async () => {
    const { PATCH } = await import('../app/api/clients/[id]/route');
    const request = new Request('http://localhost/api/clients/c1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated', version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: 'c1' }) });
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing version', async () => {
    const { PATCH } = await import('../app/api/clients/[id]/route');
    const request = new Request('http://localhost/api/clients/c1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: 'c1' }) });
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/clients/:id', () => {
  it('returns 401 without auth', async () => {
    const { DELETE } = await import('../app/api/clients/[id]/route');
    const request = new Request('http://localhost/api/clients/c1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'c1' }) });
    expect(response.status).toBe(401);
  });
});

describe('POST /api/clients/:id/status', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/clients/[id]/status/route');
    const request = new Request('http://localhost/api/clients/c1/status', {
      method: 'POST',
      body: JSON.stringify({ action: 'publish', version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request, { params: Promise.resolve({ id: 'c1' }) });
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid action', async () => {
    const { POST } = await import('../app/api/clients/[id]/status/route');
    const request = new Request('http://localhost/api/clients/c1/status', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid', version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request, { params: Promise.resolve({ id: 'c1' }) });
    expect(response.status).toBe(400);
  });
});

describe('POST /api/clients/reorder', () => {
  const validIds = ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'];

  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/clients/reorder/route');
    const request = new Request('http://localhost/api/clients/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds: validIds }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing orderedIds', async () => {
    const { POST } = await import('../app/api/clients/reorder/route');
    const request = new Request('http://localhost/api/clients/reorder', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
