import { db } from '@studioflow/db';
import { requireAuth, httpErrorResponse } from '../../../../lib/session';

// Returns the current signed-in user + role/permissions from the bearer token.
// The admin UI uses this after a silent refresh (which only returns an access token).
export async function GET(request: Request): Promise<Response> {
  try {
    const { principal } = await requireAuth(request);
    const user = await db.user.findUnique({
      where: { id: principal.id },
      select: { id: true, name: true, email: true },
    });
    return Response.json({
      id: principal.id,
      name: user?.name ?? '',
      email: user?.email ?? '',
      role: {
        name: principal.role.name,
        permissions: principal.role.permissions,
        isOwner: principal.role.isOwner,
      },
    });
  } catch (e) {
    const err = httpErrorResponse(e);
    if (err) return err;
    throw e;
  }
}
