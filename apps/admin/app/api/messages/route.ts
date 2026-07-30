import { db } from '@studioflow/db';
import { requireAuth, httpErrorResponse } from '../../../lib/session';

// Contact-form enquiries. Any signed-in admin may read them (single-studio; no
// dedicated permission in the catalog). Newest first, optional handled filter.
export async function GET(request: Request): Promise<Response> {
  try {
    await requireAuth(request);
    const url = new URL(request.url);
    const handledParam = url.searchParams.get('handled');
    const where = handledParam === 'true' || handledParam === 'false' ? { handled: handledParam === 'true' } : {};
    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return Response.json(
      messages.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        message: m.message,
        budget: m.budget,
        locale: m.locale,
        handled: m.handled,
        createdAt: m.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    const err = httpErrorResponse(e);
    if (err) return err;
    throw e;
  }
}
