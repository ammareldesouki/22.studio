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
    const { principal } = await guardRoute(request, PERMISSIONS.CLIENTS_MANAGE);
    const { id } = await params;
    const client = await clientsService.duplicate(id, principal.id);
    return Response.json(client, { status: 201 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}
