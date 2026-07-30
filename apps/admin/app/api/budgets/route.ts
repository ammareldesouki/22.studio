import { withValidation } from '@studioflow/validation';
import { createBudgetSchema } from '@studioflow/validation/budgets';
import { budgetsService, BudgetsError } from '@studioflow/core/budgets';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof BudgetsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export const GET = async (request: Request): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const items = await budgetsService.list();
    return Response.json(items);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};

export const POST = withValidation(createBudgetSchema, async (data, request) => {
  try {
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const budget = await budgetsService.create(data);
    return Response.json(budget, { status: 201 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
});
