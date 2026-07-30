import { db } from '@studioflow/db';
import { requireAuth, httpErrorResponse } from '../../../lib/session';

// At-a-glance counts for the admin dashboard. Any signed-in user may read it;
// the numbers are aggregate, not record data. Counts run in parallel.
export async function GET(request: Request): Promise<Response> {
  try {
    await requireAuth(request);
    const [projectsPublished, projectsDraft, projectsArchived, clients, services, media, messagesUnhandled, messagesTotal] =
      await Promise.all([
        db.project.count({ where: { status: 'PUBLISHED' } }),
        db.project.count({ where: { status: 'DRAFT' } }),
        db.project.count({ where: { status: 'ARCHIVED' } }),
        db.client.count(),
        db.service.count(),
        db.media.count(),
        db.message.count({ where: { handled: false } }),
        db.message.count(),
      ]);

    return Response.json({
      projects: {
        published: projectsPublished,
        draft: projectsDraft,
        archived: projectsArchived,
        total: projectsPublished + projectsDraft + projectsArchived,
      },
      clients,
      services,
      media,
      messages: { unhandled: messagesUnhandled, total: messagesTotal },
    });
  } catch (e) {
    const err = httpErrorResponse(e);
    if (err) return err;
    throw e;
  }
}
