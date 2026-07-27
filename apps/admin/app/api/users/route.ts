import { withValidation } from '@studioflow/validation';
import { createUserSchema } from '@studioflow/validation/users';
import { usersService, UsersError } from '@studioflow/core/users';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) {
    return Response.json({ error: e.message }, { status: 401 });
  }
  if (e instanceof UsersError) {
    return Response.json({ error: e.message }, { status: e.statusCode });
  }
  return null;
}

export const GET = async (request: Request): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.USERS_MANAGE);
    const users = await usersService.list();
    return Response.json(users);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};

export const POST = withValidation(createUserSchema, async (data, request) => {
  try {
    await guardRoute(request, PERMISSIONS.USERS_MANAGE);
    const user = await usersService.create(data);
    return Response.json(user, { status: 201 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
});
