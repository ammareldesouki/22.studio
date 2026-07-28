import { parseAndValidate } from '@studioflow/validation';
import { clientStatusActionSchema } from '@studioflow/validation/clients';
import { clientsService, ClientsError } from '@studioflow/core/clients';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ClientsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

interface Ctx { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const parsed = await parseAndValidate(clientStatusActionSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.CLIENTS_MANAGE);
    const { id } = await params;
    const client = await clientsService.updateStatus(id, parsed.data.action, parsed.data.version);
    return Response.json(client);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}
