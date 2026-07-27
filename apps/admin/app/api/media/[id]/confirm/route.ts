import { mediaService, MediaError } from '@studioflow/core/media';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../../lib/session';

function handleError(e: unknown): Response | null {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof MediaError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

interface Ctx { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Ctx): Promise<Response> {
  try {
    await guardRoute(request, PERMISSIONS.MEDIA_UPLOAD);
    const { id } = await params;
    const media = await mediaService.confirm(id);
    return Response.json(media, { status: 200 });
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
}
