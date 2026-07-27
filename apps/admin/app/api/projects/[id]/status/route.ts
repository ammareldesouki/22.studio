import { parseAndValidate } from '@studioflow/validation';
import { statusActionSchema } from '@studioflow/validation/projects';
import { projectsService, ProjectsError } from '@studioflow/core/projects';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ProjectsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const parsed = await parseAndValidate(statusActionSchema, request);
    if (!parsed.ok) return parsed.response;
    const needed =
      parsed.data.action === 'publish' ? PERMISSIONS.PROJECTS_PUBLISH : PERMISSIONS.PROJECTS_EDIT;
    await guardRoute(request, needed);
    const { id } = await params;
    const project = await projectsService.updateStatus(id, parsed.data.action, parsed.data.version);
    return Response.json(project);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}
