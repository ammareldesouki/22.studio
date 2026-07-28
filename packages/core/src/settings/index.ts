import { db } from '@studioflow/db';

// Fixed id enforces the singleton: upsert on this key is atomic, so concurrent first-access
// can never create duplicate Settings rows.
const SINGLETON_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULT_SETTINGS = {
  siteName: 'Studio',
  socialLinks: {},
  analyticsIds: {},
  contact: {},
};

export interface SettingsRecord {
  id: string;
  siteName: string;
  logoId: string | null;
  socialLinks: Record<string, string>;
  seoDefaults: Record<string, unknown> | null;
  analyticsIds: Record<string, string>;
  contact: Record<string, string> | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

function mapSettings(row: Record<string, unknown>): SettingsRecord {
  return {
    id: row.id as string,
    siteName: row.siteName as string,
    logoId: (row.logoId as string) ?? null,
    socialLinks: (row.socialLinks as Record<string, string>) ?? {},
    seoDefaults: (row.seoDefaults as Record<string, unknown>) ?? null,
    analyticsIds: (row.analyticsIds as Record<string, string>) ?? {},
    contact: (row.contact as Record<string, string>) ?? null,
    version: row.version as number,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

const SETTINGS_SELECT = {
  id: true,
  siteName: true,
  logoId: true,
  socialLinks: true,
  seoDefaults: true,
  analyticsIds: true,
  contact: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class SettingsService {
  async get(): Promise<SettingsRecord> {
    // Atomic get-or-create on the fixed singleton id — no findFirst/create race.
    const settings = await db.settings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID, ...DEFAULT_SETTINGS },
      select: SETTINGS_SELECT,
    });
    return mapSettings(settings as unknown as Record<string, unknown>);
  }

  async update(input: {
    siteName?: string;
    logoId?: string | null;
    socialLinks?: Record<string, string>;
    seoDefaults?: Record<string, unknown>;
    analyticsIds?: Record<string, string>;
    contact?: Record<string, string>;
    version: number;
  }): Promise<SettingsRecord> {
    // Materialize the singleton so a first-ever PATCH (before any GET) works instead of 404.
    await this.get();

    if (input.logoId) {
      const media = await db.media.findUnique({ where: { id: input.logoId }, select: { id: true } });
      if (!media) throw new SettingsError('Unknown logo media reference', 'INVALID_REF', 400);
    }

    const data: Record<string, unknown> = {};
    if (input.siteName !== undefined) data.siteName = input.siteName;
    if ('logoId' in input) data.logoId = input.logoId ?? null;
    if (input.socialLinks !== undefined) data.socialLinks = input.socialLinks as never;
    if (input.seoDefaults !== undefined) data.seoDefaults = input.seoDefaults as never;
    if (input.analyticsIds !== undefined) data.analyticsIds = input.analyticsIds as never;
    if (input.contact !== undefined) data.contact = input.contact as never;
    data.version = { increment: 1 };

    const { count } = await db.settings.updateMany({
      where: { id: SINGLETON_ID, version: input.version },
      data: data as never,
    });
    if (count === 0) throw new SettingsError('Version conflict', 'VERSION_CONFLICT', 409);

    const updated = await db.settings.findUniqueOrThrow({
      where: { id: SINGLETON_ID },
      select: SETTINGS_SELECT,
    });
    return mapSettings(updated as unknown as Record<string, unknown>);
  }
}

export class SettingsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'SettingsError';
  }
}

export const settingsService = new SettingsService();
