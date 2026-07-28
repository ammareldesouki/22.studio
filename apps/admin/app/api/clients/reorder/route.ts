import { parseAndValidate } from '@studioflow/validation';
import { reorderSchema } from '@studioflow/validation/clients';
import { clientsService, ClientsError } from '@studioflow/core/clients';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ClientsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseAndValidate(reorderSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.CLIENTS_MANAGE);
    await clientsService.reorder(parsed.data.orderedIds);
    return Response.json({ ok: true });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}
