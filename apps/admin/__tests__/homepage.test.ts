import { describe, it, expect } from 'vitest';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

describe('GET /api/homepage', () => {
  it('returns 401 without auth', async () => {
    const { GET } = await import('../app/api/homepage/route');
    const request = new Request('http://localhost/api/homepage');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/homepage/sections', () => {
  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/homepage/sections/route');
    const request = new Request('http://localhost/api/homepage/sections', {
      method: 'POST',
      body: JSON.stringify({ type: 'HERO' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for unknown section type', async () => {
    const { POST } = await import('../app/api/homepage/sections/route');
    const request = new Request('http://localhost/api/homepage/sections', {
      method: 'POST',
      body: JSON.stringify({ type: 'INVALID' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for malformed body', async () => {
    const { POST } = await import('../app/api/homepage/sections/route');
    const request = new Request('http://localhost/api/homepage/sections', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/homepage/sections/:id', () => {
  it('returns 401 without auth', async () => {
    const { PATCH } = await import('../app/api/homepage/sections/[id]/route');
    const request = new Request(`http://localhost/api/homepage/sections/${validUuid}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: false, version: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: validUuid }) });
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing version', async () => {
    const { PATCH } = await import('../app/api/homepage/sections/[id]/route');
    const request = new Request(`http://localhost/api/homepage/sections/${validUuid}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: false }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: validUuid }) });
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/homepage/sections/:id', () => {
  it('returns 401 without auth', async () => {
    const { DELETE } = await import('../app/api/homepage/sections/[id]/route');
    const request = new Request(`http://localhost/api/homepage/sections/${validUuid}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: validUuid }) });
    expect(response.status).toBe(401);
  });
});

describe('POST /api/homepage/reorder', () => {
  const ids = [
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
  ];

  it('returns 401 without auth', async () => {
    const { POST } = await import('../app/api/homepage/reorder/route');
    const request = new Request('http://localhost/api/homepage/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds: ids }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing orderedIds', async () => {
    const { POST } = await import('../app/api/homepage/reorder/route');
    const request = new Request('http://localhost/api/homepage/reorder', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
