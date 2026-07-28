import { parseAndValidate } from '@studioflow/validation';
import { updateClientSchema } from '@studioflow/validation/clients';
import { clientsService, ClientsError } from '@studioflow/core/clients';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ClientsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

interface Ctx { params: Promise<{ id: string }> }

export const GET = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.CLIENTS_MANAGE);
    const { id } = await params;
    const client = await clientsService.getById(id);
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });
    return Response.json(client);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const parsed = await parseAndValidate(updateClientSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.CLIENTS_MANAGE);
    const { id } = await params;
    const client = await clientsService.update(id, parsed.data);
    return Response.json(client);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}

export const DELETE = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.CLIENTS_MANAGE);
    const { id } = await params;
    await clientsService.delete(id);
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};
