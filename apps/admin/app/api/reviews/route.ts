import { withValidation } from '@studioflow/validation';
import { createReviewSchema } from '@studioflow/validation/reviews';
import { reviewsService, ReviewsError } from '@studioflow/core/reviews';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ReviewsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export const GET = async (request: Request): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const items = await reviewsService.list();
    return Response.json(items);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};

export const POST = withValidation(createReviewSchema, async (data, request) => {
  try {
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const review = await reviewsService.create(data);
    return Response.json(review, { status: 201 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
});
