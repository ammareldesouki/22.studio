import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@studioflow/core/auth', () => ({
  verifyPassword: vi.fn(),
  signAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(() => 'raw-refresh-token'),
  hashToken: vi.fn((t: string) => `hashed-${t}`),
  refreshTokenExpiry: vi.fn(() => new Date(Date.now() + 7 * 86400 * 1000)),
}));

vi.mock('@studioflow/core/users', () => ({
  usersService: { getByEmail: vi.fn() },
}));

vi.mock('@studioflow/core/auth/store', () => ({
  refreshTokenStore: { create: vi.fn() },
}));

vi.mock('@studioflow/core/roles', () => ({
  rolesService: { getById: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const validCredentials = { email: 'owner@studio.com', password: 'correct-password' };

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

  it('rate-limits after 5 rapid attempts from same IP', async () => {
    const { verifyPassword } = await import('@studioflow/core/auth');
    const { usersService } = await import('@studioflow/core/users');
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(usersService.getByEmail).mockResolvedValue({
      id: 'u1', name: 'Owner', email: validCredentials.email, passwordHash: '',
      roleId: 'r1', active: true, version: 1, createdAt: new Date(), updatedAt: new Date(),
    });

    const { POST } = await import('../app/api/auth/login/route');
    const body = JSON.stringify(validCredentials);
    const baseHeaders = { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.1' };

    // First 5 requests — should succeed
    for (let i = 0; i < 5; i++) {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST', body, headers: baseHeaders,
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    // 6th request from same IP — rate limited
    const req6 = new Request('http://localhost/api/auth/login', {
      method: 'POST', body, headers: baseHeaders,
    });
    const res6 = await POST(req6);
    expect(res6.status).toBe(429);
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
