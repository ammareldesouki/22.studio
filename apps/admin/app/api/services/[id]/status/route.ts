import { parseAndValidate } from '@studioflow/validation';
import { serviceStatusActionSchema } from '@studioflow/validation/services';
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
    const parsed = await parseAndValidate(serviceStatusActionSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.SERVICES_MANAGE);
    const { id } = await params;
    const service = await servicesService.updateStatus(id, parsed.data.action, parsed.data.version);
    return Response.json(service);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}
