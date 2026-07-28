import { parseAndValidate } from '@studioflow/validation';
import { updateSubServiceSchema } from '@studioflow/validation/services';
import { servicesService, ServicesError } from '@studioflow/core/services';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ServicesError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

interface Ctx { params: Promise<{ subServiceId: string }> }

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const parsed = await parseAndValidate(updateSubServiceSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.SERVICES_MANAGE);
    const { subServiceId } = await params;
    const subService = await servicesService.updateSubService(subServiceId, parsed.data);
    return Response.json(subService);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}

export const DELETE = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.SERVICES_MANAGE);
    const { subServiceId } = await params;
    await servicesService.deleteSubService(subServiceId);
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};
