import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsService } from '.';

vi.mock('@studioflow/db', () => ({
  db: {
    settings: {
      upsert: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      updateMany: vi.fn(),
    },
    media: {
      findUnique: vi.fn(),
    },
  },
}));

const { db } = await import('@studioflow/db');

beforeEach(() => {
  vi.clearAllMocks();
});

function mockSettings(overrides: Record<string, unknown> = {}) {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    siteName: 'Studio',
    logoId: null,
    socialLinks: {},
    seoDefaults: null,
    analyticsIds: {},
    contact: null,
    version: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('SettingsService', () => {
  describe('get', () => {
    it('upserts the singleton and returns it (no findFirst/create race)', async () => {
      vi.mocked(db.settings.upsert).mockResolvedValueOnce(mockSettings() as never);
      const result = await settingsService.get();
      expect(result.siteName).toBe('Studio');
      expect(db.settings.upsert).toHaveBeenCalledOnce();
      const arg = vi.mocked(db.settings.upsert).mock.calls[0]![0] as { where: { id: string } };
      expect(arg.where.id).toBe('00000000-0000-0000-0000-000000000001');
    });
  });

  describe('update', () => {
    it('updates siteName and bumps version', async () => {
      vi.mocked(db.settings.upsert).mockResolvedValueOnce(mockSettings() as never);
      vi.mocked(db.settings.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.settings.findUniqueOrThrow).mockResolvedValueOnce(
        mockSettings({ siteName: 'Renamed', version: 2 }) as never,
      );
      const result = await settingsService.update({ siteName: 'Renamed', version: 1 });
      expect(result.siteName).toBe('Renamed');
      expect(result.version).toBe(2);
    });

    it('works on first write (no prior GET) — materializes the singleton', async () => {
      vi.mocked(db.settings.upsert).mockResolvedValueOnce(mockSettings() as never);
      vi.mocked(db.settings.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.settings.findUniqueOrThrow).mockResolvedValueOnce(mockSettings({ siteName: 'First' }) as never);
      const result = await settingsService.update({ siteName: 'First', version: 1 });
      expect(db.settings.upsert).toHaveBeenCalledOnce();
      expect(result.siteName).toBe('First');
    });

    it('throws 409 (not 500) on version conflict', async () => {
      vi.mocked(db.settings.upsert).mockResolvedValueOnce(mockSettings() as never);
      vi.mocked(db.settings.updateMany).mockResolvedValueOnce({ count: 0 } as never);
      await expect(
        settingsService.update({ siteName: 'Renamed', version: 99 }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'VERSION_CONFLICT' });
    });

    it('rejects an unknown logoId with 400 (not a raw FK 500)', async () => {
      vi.mocked(db.settings.upsert).mockResolvedValueOnce(mockSettings() as never);
      vi.mocked(db.media.findUnique).mockResolvedValueOnce(null);
      await expect(
        settingsService.update({ logoId: '550e8400-e29b-41d4-a716-446655440000', version: 1 }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('accepts a valid logoId and all optional fields', async () => {
      vi.mocked(db.settings.upsert).mockResolvedValueOnce(mockSettings() as never);
      vi.mocked(db.media.findUnique).mockResolvedValueOnce({ id: '550e8400-e29b-41d4-a716-446655440000' } as never);
      vi.mocked(db.settings.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.settings.findUniqueOrThrow).mockResolvedValueOnce(
        mockSettings({ siteName: 'Updated', logoId: '550e8400-e29b-41d4-a716-446655440000', version: 2 }) as never,
      );
      const result = await settingsService.update({
        siteName: 'Updated',
        logoId: '550e8400-e29b-41d4-a716-446655440000',
        socialLinks: { instagram: 'https://instagram.com/22studi' },
        contact: { email: 'hello@studio.com' },
        version: 1,
      });
      expect(result.logoId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });
});
