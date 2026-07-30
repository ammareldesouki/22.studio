import { projectsService, ProjectsError } from '@studioflow/core/projects';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ProjectsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

interface Ctx { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const { principal } = await guardRoute(request, PERMISSIONS.PROJECTS_CREATE);
    const { id } = await params;
    const project = await projectsService.duplicate(id, principal.id);
    return Response.json(project, { status: 201 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}
