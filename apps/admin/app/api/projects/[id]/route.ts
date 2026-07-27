import { parseAndValidate } from '@studioflow/validation';
import { updateProjectSchema } from '@studioflow/validation/projects';
import { projectsService, ProjectsError } from '@studioflow/core/projects';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ProjectsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

type Ctx = { params: Promise<{ id: string }> };

export const GET = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.PROJECTS_CREATE);
    const { id } = await params;
    const project = await projectsService.getById(id);
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
    return Response.json(project);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const parsed = await parseAndValidate(updateProjectSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.PROJECTS_EDIT);
    const { id } = await params;
    const project = await projectsService.update(id, parsed.data);
    return Response.json(project);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}

export const DELETE = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.PROJECTS_DELETE);
    const { id } = await params;
    await projectsService.delete(id);
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};
