import { withValidation } from '@studioflow/validation';
import { createProjectSchema } from '@studioflow/validation/projects';
import { projectsService, ProjectsError } from '@studioflow/core/projects';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ProjectsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export const GET = async (request: Request): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.PROJECTS_CREATE);
    const url = new URL(request.url);
    const result = await projectsService.list({
      cursor: url.searchParams.get('cursor') ?? undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') ?? '', 10) : undefined,
      status: url.searchParams.get('status') ?? undefined,
      clientId: url.searchParams.get('clientId') ?? undefined,
      serviceId: url.searchParams.get('serviceId') ?? undefined,
      featured: url.searchParams.has('featured') ? url.searchParams.get('featured') === 'true' : undefined,
    });
    return Response.json(result);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};

export const POST = withValidation(createProjectSchema, async (data, request) => {
  try {
    const { principal } = await guardRoute(request, PERMISSIONS.PROJECTS_CREATE);
    const project = await projectsService.create({ ...data, createdById: principal.id });
    return Response.json(project, { status: 201 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
});
