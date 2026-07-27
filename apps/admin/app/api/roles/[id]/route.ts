import { parseAndValidate } from '@studioflow/validation';
import { updateRoleSchema } from '@studioflow/validation/roles';
import { rolesService, RolesError } from '@studioflow/core/roles';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

function handleError(e: unknown): Response | null {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof RolesError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await guardRoute(request, PERMISSIONS.ROLES_MANAGE);
    const { id } = await params;
    const parsed = await parseAndValidate(updateRoleSchema, request);
    if (!parsed.ok) return parsed.response;
    const role = await rolesService.update(id, parsed.data);
    return Response.json(role);
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await guardRoute(request, PERMISSIONS.ROLES_MANAGE);
    const { id } = await params;
    await rolesService.delete(id);
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
}
