import { parseAndValidate } from '@studioflow/validation';
import { serviceReorderSchema } from '@studioflow/validation/services';
import { servicesService, ServicesError } from '@studioflow/core/services';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ServicesError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseAndValidate(serviceReorderSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.SERVICES_MANAGE);
    await servicesService.reorder(parsed.data.orderedIds);
    return Response.json({ ok: true });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}
