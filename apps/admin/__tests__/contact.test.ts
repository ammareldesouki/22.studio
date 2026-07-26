import { describe, it, expect } from 'vitest';

describe('POST /api/contact', () => {
  it('rejects invalid input with 400 and consistent error envelope', async () => {
    const { POST } = await import('../app/api/contact/route');

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'not-an-email', message: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error', 'Validation failed');
    expect(body).toHaveProperty('issues');
    expect(Array.isArray(body.issues)).toBe(true);
    expect(body.issues.length).toBeGreaterThan(0);
    expect(body.issues[0]).toHaveProperty('path');
    expect(body.issues[0]).toHaveProperty('message');
  });

  it('rejects malformed JSON with 400 (not a 500/throw)', async () => {
    const { POST } = await import('../app/api/contact/route');

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ this is not json',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error', 'Invalid JSON');
    expect(Array.isArray(body.issues)).toBe(true);
  });

  it('accepts valid input with 200', async () => {
    const { POST } = await import('../app/api/contact/route');

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@example.com', message: 'Hello!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body.data).toEqual({ name: 'Alice', email: 'alice@example.com', message: 'Hello!' });
  });
});
