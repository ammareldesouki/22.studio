import { signAccessToken, hashToken, generateRefreshToken, refreshTokenExpiry } from '@studioflow/core/auth';
import { refreshTokenStore } from '@studioflow/core/auth/store';
import { usersService } from '@studioflow/core/users';
import { AUTH_COOKIE_PATH } from '../../../../lib/base-path';

export async function POST(request: Request): Promise<Response> {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const match = cookieHeader.match(/refresh_token=([^;]+)/);
  const rawToken: string | undefined = match?.[1];
  if (!rawToken) {
    return Response.json({ error: 'No refresh token' }, { status: 401 });
  }
  const hashed = hashToken(rawToken);
  const record = await refreshTokenStore.findByHash(hashed);
  if (!record) {
    return Response.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
  }

  await refreshTokenStore.revoke(record.id);

  // Reject refresh for a deleted/deactivated user (and don't re-issue tokens).
  const user = await usersService.getById(record.userId);
  if (!user || !user.active) {
    await refreshTokenStore.revokeAllForUser(record.userId);
    return Response.json({ error: 'Account is no longer active' }, { status: 401 });
  }

  const accessToken = await signAccessToken({ userId: user.id, roleId: user.roleId });
  const newRawToken = generateRefreshToken();
  await refreshTokenStore.create({
    id: '',
    hashedToken: hashToken(newRawToken),
    userId: record.userId,
    expiresAt: refreshTokenExpiry(),
    revoked: false,
  });

  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    `refresh_token=${newRawToken}; HttpOnly; Secure; SameSite=Lax; Path=${AUTH_COOKIE_PATH}; Max-Age=${7 * 86400}`,
  );

  return Response.json({ accessToken }, { status: 200, headers });
}
