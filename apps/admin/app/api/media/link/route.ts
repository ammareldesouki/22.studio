import { withValidation } from '@studioflow/validation';
import { createMediaLinkSchema } from '@studioflow/validation/media';
import { mediaService, MediaError } from '@studioflow/core/media';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

function handleError(e: unknown): Response | null {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof MediaError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

// Add a media item from an external URL (no upload). Same permission as uploading.
export const POST = withValidation(createMediaLinkSchema, async (data, request) => {
  try {
    await guardRoute(request, PERMISSIONS.MEDIA_UPLOAD);
    const media = await mediaService.createFromUrl(data);
    return Response.json(media, { status: 201 });
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
});
