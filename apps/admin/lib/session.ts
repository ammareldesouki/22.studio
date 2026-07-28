import { db } from '@studioflow/db';
import { type Permission } from '@studioflow/types';
import { requirePermission, type Principal } from '@studioflow/core/rbac';
import { verifyAccessToken, type AccessTokenPayload } from '@studioflow/core/auth';

// Single source of truth for JWT signing/verification lives in @studioflow/core/auth.
export type SessionPayload = AccessTokenPayload;

export async function getSession(request: Request): Promise<SessionPayload | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  try {
    return await verifyAccessToken(auth.slice(7));
  } catch {
    return null;
  }
}

export async function loadPrincipal(payload: SessionPayload): Promise<Principal | null> {
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: { role: true },
  });
  if (!user || !user.active) return null;
  return {
    id: user.id,
    role: {
      id: user.role.id,
      name: user.role.name,
      permissions: user.role.permissions,
      isOwner: user.role.isOwner,
    },
  };
}

export async function requireAuth(
  request: Request,
): Promise<{ principal: Principal; payload: SessionPayload }> {
  const payload = await getSession(request);
  if (!payload) {
    throw new SessionError('Unauthorized', 'UNAUTHORIZED');
  }

  const principal = await loadPrincipal(payload);
  if (!principal) {
    throw new SessionError('Unauthorized', 'UNAUTHORIZED');
  }

  return { principal, payload };
}

export async function guardRoute(
  request: Request,
  permission: Permission,
): Promise<{ principal: Principal; payload: SessionPayload }> {
  const { principal, payload } = await requireAuth(request);
  requirePermission(principal, permission);
  return { principal, payload };
}

export class SessionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

/**
 * Shared route error mapper. Maps auth failures to 401 and any domain error that carries a
 * numeric `statusCode` (SettingsError, HomepageError, …, and ContentEngineError) to that
 * status — so a leaked version-conflict becomes a 409, never an unmapped 500. Returns null
 * for unrecognized errors so the caller rethrows (→ 500).
 */
export function httpErrorResponse(e: unknown): Response | null {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof Error) {
    const status = (e as unknown as { statusCode?: unknown }).statusCode;
    if (typeof status === 'number') {
      return Response.json({ error: e.message }, { status });
    }
  }
  return null;
}
