import { db } from '@studioflow/db';
import { requireAuth, httpErrorResponse } from '../../../../lib/session';

interface Ctx { params: Promise<{ id: string }> }

// Mark an enquiry handled/unhandled.
export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  try {
    await requireAuth(request);
    const { id } = await ctx.params;
    const body = (await request.json().catch(() => ({}))) as { handled?: unknown };
    if (typeof body.handled !== 'boolean') {
      return Response.json({ error: '`handled` must be a boolean' }, { status: 400 });
    }
    const existing = await db.message.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Message not found' }, { status: 404 });
    const updated = await db.message.update({ where: { id }, data: { handled: body.handled } });
    return Response.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      message: updated.message,
      budget: updated.budget,
      locale: updated.locale,
      handled: updated.handled,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (e) {
    const err = httpErrorResponse(e);
    if (err) return err;
    throw e;
  }
}

// Delete an enquiry.
export async function DELETE(request: Request, ctx: Ctx): Promise<Response> {
  try {
    await requireAuth(request);
    const { id } = await ctx.params;
    const existing = await db.message.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Message not found' }, { status: 404 });
    await db.message.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = httpErrorResponse(e);
    if (err) return err;
    throw e;
  }
}
