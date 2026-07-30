import { parseAndValidate } from '@studioflow/validation';
import { projectReorderSchema } from '@studioflow/validation/projects';
import { projectsService, ProjectsError } from '@studioflow/core/projects';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ProjectsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseAndValidate(projectReorderSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.PROJECTS_EDIT);
    await projectsService.reorder(parsed.data.orderedIds);
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}
