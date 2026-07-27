import { rolesService, RolesError } from '@studioflow/core/roles';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../lib/session';

function handleError(e: unknown): Response | null {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof RolesError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export const GET = async (request: Request): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.ROLES_MANAGE);
    const catalog = await rolesService.getCatalog();
    return Response.json(catalog);
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
};
