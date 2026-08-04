import { parseAndValidate } from '@studioflow/validation';
import { updateReviewSchema } from '@studioflow/validation/reviews';
import { reviewsService, ReviewsError } from '@studioflow/core/reviews';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ReviewsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const parsed = await parseAndValidate(updateReviewSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const { id } = await params;
    const review = await reviewsService.update(id, parsed.data);
    return Response.json(review);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}

export const DELETE = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const { id } = await params;
    await reviewsService.delete(id);
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};
