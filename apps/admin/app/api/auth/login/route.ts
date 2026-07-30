import { withValidation } from '@studioflow/validation';
import { loginSchema } from '@studioflow/validation/auth';
import { verifyPassword, signAccessToken, generateRefreshToken, hashToken, refreshTokenExpiry } from '@studioflow/core/auth';
import { refreshTokenStore } from '@studioflow/core/auth/store';
import { usersService } from '@studioflow/core/users';
import { AUTH_COOKIE_PATH } from '../../../../lib/base-path';

// Simple in-memory rate-limiter for login (per-IP, 5 attempts per 60s)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export const POST = withValidation(loginSchema, async (data, request) => {
  // Best-effort per-IP limiter (in-memory, per serverless instance). A shared store
  // (e.g. Upstash/Redis) is the durable follow-up; keying by IP stops a single client
  // from locking out everyone.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (!checkRateLimit(ip)) {
    return Response.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const user = await usersService.getByEmail(data.email);
  if (!user) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = await verifyPassword(user.passwordHash, data.password);
  if (!valid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!user.active) {
    return Response.json({ error: 'Account is deactivated' }, { status: 401 });
  }

  const accessToken = await signAccessToken({ userId: user.id, roleId: user.roleId });

  const rawToken = generateRefreshToken();
  await refreshTokenStore.create({
    id: '',
    hashedToken: hashToken(rawToken),
    userId: user.id,
    expiresAt: refreshTokenExpiry(),
    revoked: false,
  });

  const role = await (await import('@studioflow/core/roles')).rolesService.getById(user.roleId);

  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    `refresh_token=${rawToken}; HttpOnly; Secure; SameSite=Lax; Path=${AUTH_COOKIE_PATH}; Max-Age=${7 * 86400}`,
  );

  return Response.json(
    {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role ? { id: role.id, name: role.name, permissions: role.permissions } : null,
      },
    },
    { status: 200, headers },
  );
});
