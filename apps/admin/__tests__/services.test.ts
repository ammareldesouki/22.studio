import { describe, it, expect } from 'vitest';

describe('GET /api/services', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/services/route');
    const request = new Request('http://localhost/api/services');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/services', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/services/route');
    const request = new Request('http://localhost/api/services', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Service' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing name', async () => {
    const { POST } = await import('../app/api/services/route');
    const request = new Request('http://localhost/api/services', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for malformed body', async () => {
    const { POST } = await import('../app/api/services/route');
    const request = new Request('http://localhost/api/services', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('GET /api/services/:id', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/services/[id]/route');
    const request = new Request('http://localhost/api/services/s1');
    const response = await GET(request, { params: Promise.resolve({ id: 's1' }) });
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/services/:id', () => {
  it('returns 401 without auth', async () => {
    const { PATCH } = await import('../app/api/services/[id]/route');
    const request = new Request('http://localhost/api/services/s1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated', version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: 's1' }) });
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing version', async () => {
    const { PATCH } = await import('../app/api/services/[id]/route');
    const request = new Request('http://localhost/api/services/s1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: 's1' }) });
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/services/:id', () => {
  it('returns 401 without auth', async () => {
    const { DELETE } = await import('../app/api/services/[id]/route');
    const request = new Request('http://localhost/api/services/s1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 's1' }) });
    expect(response.status).toBe(401);
  });
});

describe('POST /api/services/:id/status', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/services/[id]/status/route');
    const request = new Request('http://localhost/api/services/s1/status', {
      method: 'POST',
      body: JSON.stringify({ action: 'publish', version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request, { params: Promise.resolve({ id: 's1' }) });
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid action', async () => {
    const { POST } = await import('../app/api/services/[id]/status/route');
    const request = new Request('http://localhost/api/services/s1/status', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid', version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request, { params: Promise.resolve({ id: 's1' }) });
    expect(response.status).toBe(400);
  });
});

describe('POST /api/services/:id/subservices', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/services/[id]/subservices/route');
    const request = new Request('http://localhost/api/services/s1/subservices', {
      method: 'POST',
      body: JSON.stringify({ name: 'Sub Service' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request, { params: Promise.resolve({ id: 's1' }) });
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing name', async () => {
    const { POST } = await import('../app/api/services/[id]/subservices/route');
    const request = new Request('http://localhost/api/services/s1/subservices', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request, { params: Promise.resolve({ id: 's1' }) });
    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/services/subservices/:subServiceId', () => {
  it('returns 401 without auth', async () => {
    const { PATCH } = await import('../app/api/services/subservices/[subServiceId]/route');
    const request = new Request('http://localhost/api/services/subservices/ss1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request, { params: Promise.resolve({ subServiceId: 'ss1' }) });
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/services/subservices/:subServiceId', () => {
  it('returns 401 without auth', async () => {
    const { DELETE } = await import('../app/api/services/subservices/[subServiceId]/route');
    const request = new Request('http://localhost/api/services/subservices/ss1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ subServiceId: 'ss1' }) });
    expect(response.status).toBe(401);
  });
});

describe('POST /api/services/reorder', () => {
  const validIds = ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'];

  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/services/reorder/route');
    const request = new Request('http://localhost/api/services/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds: validIds }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing orderedIds', async () => {
    const { POST } = await import('../app/api/services/reorder/route');
    const request = new Request('http://localhost/api/services/reorder', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
