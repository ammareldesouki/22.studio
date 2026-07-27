import { mediaService, MediaError } from '@studioflow/core/media';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../lib/session';

function handleError(e: unknown): Response | null {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof MediaError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export const GET = async (request: Request): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.MEDIA_UPLOAD);
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const rawLimit = url.searchParams.get('limit');
    const limit = rawLimit ? parseInt(rawLimit, 10) : undefined;
    const folderId = url.searchParams.get('folderId') ?? undefined;
    const tag = url.searchParams.get('tag') ?? undefined;
    const type = url.searchParams.get('type') ?? undefined;

    const result = await mediaService.list({ cursor, limit, folderId, tag, type });
    return Response.json(result);
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
};
