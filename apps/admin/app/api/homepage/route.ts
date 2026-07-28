import { homepageService, HomepageError } from '@studioflow/core/homepage';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof HomepageError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export const GET = async (request: Request): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.HOMEPAGE_MANAGE);
    const sections = await homepageService.list();
    return Response.json(sections);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};
