import { parseAndValidate } from '@studioflow/validation';
import { homepageReorderSchema } from '@studioflow/validation/homepage';
import { homepageService, HomepageError } from '@studioflow/core/homepage';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof HomepageError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseAndValidate(homepageReorderSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.HOMEPAGE_MANAGE);
    await homepageService.reorder(parsed.data.orderedIds);
    return Response.json({ ok: true });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}
