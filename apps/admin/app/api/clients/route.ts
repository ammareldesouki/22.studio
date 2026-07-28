import { withValidation } from '@studioflow/validation';
import { createClientSchema } from '@studioflow/validation/clients';
import { clientsService, ClientsError } from '@studioflow/core/clients';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ClientsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export const GET = async (request: Request): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.CLIENTS_MANAGE);
    const url = new URL(request.url);
    const result = await clientsService.list({
      cursor: url.searchParams.get('cursor') ?? undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') ?? '', 10) : undefined,
    });
    return Response.json(result);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};

export const POST = withValidation(createClientSchema, async (data, request) => {
  try {
    const { principal } = await guardRoute(request, PERMISSIONS.CLIENTS_MANAGE);
    const client = await clientsService.create({ ...data, createdById: principal.id });
    return Response.json(client, { status: 201 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
});
