import { mediaService } from '@studioflow/core/media';

export const dynamic = 'force-dynamic';

/**
 * Scheduled housekeeping (T043): purge unconfirmed media upload-intents (DB rows + their R2
 * objects) so abandoned uploads never accumulate. Triggered by a Vercel Cron (see vercel.json);
 * authorized with the CRON_SECRET bearer token that Vercel Cron sends.
 */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const removed = await mediaService.cleanupUnconfirmed();
  return Response.json({ ok: true, removed });
}
