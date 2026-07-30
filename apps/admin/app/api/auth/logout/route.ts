import { refreshTokenStore } from '@studioflow/core/auth/store';
import { getSession } from '../../../../lib/session';
import { AUTH_COOKIE_PATH } from '../../../../lib/base-path';

export async function POST(request: Request): Promise<Response> {
  const payload = await getSession(request);
  if (!payload) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await refreshTokenStore.revokeAllForUser(payload.userId);

  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    `refresh_token=; HttpOnly; Secure; SameSite=Lax; Path=${AUTH_COOKIE_PATH}; Max-Age=0`,
  );

  return Response.json({ ok: true }, { status: 200, headers });
}
