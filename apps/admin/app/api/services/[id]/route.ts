import { parseAndValidate } from '@studioflow/validation';
import { updateServiceSchema } from '@studioflow/validation/services';
import { servicesService, ServicesError } from '@studioflow/core/services';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ServicesError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

interface Ctx { params: Promise<{ id: string }> }

export const GET = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.SERVICES_MANAGE);
    const { id } = await params;
    const service = await servicesService.getById(id);
    if (!service) return Response.json({ error: 'Service not found' }, { status: 404 });
    return Response.json(service);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const parsed = await parseAndValidate(updateServiceSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.SERVICES_MANAGE);
    const { id } = await params;
    const service = await servicesService.update(id, parsed.data);
    return Response.json(service);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}

export const DELETE = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.SERVICES_MANAGE);
    const { id } = await params;
    await servicesService.delete(id);
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};
