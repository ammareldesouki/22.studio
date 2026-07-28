import { withValidation } from '@studioflow/validation';
import { createServiceSchema } from '@studioflow/validation/services';
import { servicesService, ServicesError } from '@studioflow/core/services';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ServicesError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export const GET = async (request: Request): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.SERVICES_MANAGE);
    const url = new URL(request.url);
    const result = await servicesService.list({
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

export const POST = withValidation(createServiceSchema, async (data, request) => {
  try {
    const { principal } = await guardRoute(request, PERMISSIONS.SERVICES_MANAGE);
    const service = await servicesService.create({ ...data, createdById: principal.id });
    return Response.json(service, { status: 201 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
});
