import { parseAndValidate } from '@studioflow/validation';
import { createSubServiceSchema } from '@studioflow/validation/services';
import { servicesService, ServicesError } from '@studioflow/core/services';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ServicesError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

interface Ctx { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const parsed = await parseAndValidate(createSubServiceSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.SERVICES_MANAGE);
    const { id: serviceId } = await params;
    const subService = await servicesService.createSubService(serviceId, parsed.data);
    return Response.json(subService, { status: 201 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}
