import { withValidation } from '@studioflow/validation';
import { createRoleSchema } from '@studioflow/validation/roles';
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
    const roles = await rolesService.list();
    return Response.json(roles);
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
};

export const POST = withValidation(createRoleSchema, async (data, request) => {
  try {
    await guardRoute(request, PERMISSIONS.ROLES_MANAGE);
    const role = await rolesService.create(data);
    return Response.json(role, { status: 201 });
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
});
