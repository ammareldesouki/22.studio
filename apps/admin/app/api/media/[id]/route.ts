import { parseAndValidate } from '@studioflow/validation';
import { updateMediaSchema } from '@studioflow/validation/media';
import { mediaService, MediaError } from '@studioflow/core/media';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

function handleError(e: unknown): Response | null {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof MediaError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

type Ctx = { params: Promise<{ id: string }> };

export const GET = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.MEDIA_UPLOAD);
    const { id } = await params;
    const media = await mediaService.getById(id);
    if (!media) {
      return Response.json({ error: 'Media not found' }, { status: 404 });
    }
    return Response.json(media);
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
};

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  try {
    await guardRoute(request, PERMISSIONS.MEDIA_UPLOAD);
    const { id } = await params;
    const parsed = await parseAndValidate(updateMediaSchema, request);
    if (!parsed.ok) return parsed.response;
    const media = await mediaService.update(id, parsed.data);
    return Response.json(media);
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
}

export const DELETE = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.MEDIA_DELETE);
    const { id } = await params;
    await mediaService.delete(id);
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
};
