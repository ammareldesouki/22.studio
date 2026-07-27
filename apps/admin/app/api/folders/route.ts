import { withValidation } from '@studioflow/validation';
import { createFolderSchema } from '@studioflow/validation/media';
import { folderService, MediaError } from '@studioflow/core/media';
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
    const folders = await folderService.list();
    return Response.json(folders);
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
};

export const POST = withValidation(createFolderSchema, async (data, request) => {
  try {
    await guardRoute(request, PERMISSIONS.MEDIA_UPLOAD);
    const folder = await folderService.create(data);
    return Response.json(folder, { status: 201 });
  } catch (e) {
    const err = handleError(e);
    if (err) return err;
    throw e;
  }
});
