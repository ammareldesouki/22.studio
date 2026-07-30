import { parseAndValidate } from '@studioflow/validation';
import { updateBudgetSchema } from '@studioflow/validation/budgets';
import { budgetsService, BudgetsError } from '@studioflow/core/budgets';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof BudgetsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const parsed = await parseAndValidate(updateBudgetSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const { id } = await params;
    const budget = await budgetsService.update(id, parsed.data);
    return Response.json(budget);
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
    await budgetsService.delete(id);
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};
