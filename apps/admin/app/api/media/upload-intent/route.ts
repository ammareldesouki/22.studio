import { withValidation } from '@studioflow/validation';
import { uploadIntentSchema } from '@studioflow/validation/media';
import { mediaService, MediaError } from '@studioflow/core/media';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

function handleError(e: unknown): Response | null {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof MediaError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export const POST = withValidation(uploadIntentSchema, async (data, request) => {
  try {
    await guardRoute(request, PERMISSIONS.MEDIA_UPLOAD);
    const result = await mediaService.createUploadIntent(data);
    return Response.json(result, { status: 200 });
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
});
