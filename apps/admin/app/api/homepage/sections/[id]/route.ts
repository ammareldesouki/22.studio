import { parseAndValidate } from '@studioflow/validation';
import { updateHomepageSectionSchema, validateSectionConfig } from '@studioflow/validation/homepage';
import { homepageService, HomepageError } from '@studioflow/core/homepage';
import { db } from '@studioflow/db';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof HomepageError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const parsed = await parseAndValidate(updateHomepageSectionSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.HOMEPAGE_MANAGE);
    const { id } = await params;

    let input = parsed.data;
    if (parsed.data.config) {
      const current = await db.homepageSection.findUnique({
        where: { id },
        select: { id: true, type: true },
      });
      if (!current) return Response.json({ error: 'Section not found' }, { status: 404 });
      const configResult = validateSectionConfig(current.type, parsed.data.config);
      if (!configResult.success) {
        return Response.json(
          { error: `Invalid config for ${current.type}: ${configResult.error}` },
          { status: 400 },
        );
      }
      // Persist the validated/normalized config, not the raw request body.
      input = { ...parsed.data, config: configResult.data };
    }

    const section = await homepageService.update(id, input);
    return Response.json(section);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}

export const DELETE = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.HOMEPAGE_MANAGE);
    const { id } = await params;
    await homepageService.delete(id);
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};
