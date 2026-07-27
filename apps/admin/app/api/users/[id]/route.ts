import { parseAndValidate } from '@studioflow/validation';
import { updateUserSchema } from '@studioflow/validation/users';
import { usersService, UsersError } from '@studioflow/core/users';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

function handleError(e: unknown): Response | null {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof UsersError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await guardRoute(request, PERMISSIONS.USERS_MANAGE);
    const { id } = await params;
    const parsed = await parseAndValidate(updateUserSchema, request);
    if (!parsed.ok) return parsed.response;
    const user = await usersService.update(id, parsed.data);
    return Response.json(user);
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
}
