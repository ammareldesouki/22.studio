import { parseAndValidate } from '@studioflow/validation';
import { createHomepageSectionSchema } from '@studioflow/validation/homepage';
import { homepageService, HomepageError } from '@studioflow/core/homepage';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof HomepageError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseAndValidate(createHomepageSectionSchema, request);
    if (!parsed.ok) return parsed.response;
    const { principal } = await guardRoute(request, PERMISSIONS.HOMEPAGE_MANAGE);
    const section = await homepageService.create({ ...parsed.data, createdById: principal.id });
    return Response.json(section, { status: 201 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}
