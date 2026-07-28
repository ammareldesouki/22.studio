import { parseAndValidate } from '@studioflow/validation';
import { updateSettingsSchema } from '@studioflow/validation/settings';
import { settingsService } from '@studioflow/core/settings';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, httpErrorResponse } from '../../../lib/session';

export const GET = async (request: Request): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const settings = await settingsService.get();
    return Response.json(settings);
  } catch (e) {
    const err = httpErrorResponse(e);
    if (err) return err;
    throw e;
  }
};

export async function PATCH(request: Request): Promise<Response> {
  try {
    const parsed = await parseAndValidate(updateSettingsSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const settings = await settingsService.update(parsed.data);
    return Response.json(settings);
  } catch (e) {
    const err = httpErrorResponse(e);
    if (err) return err;
    throw e;
  }
}
