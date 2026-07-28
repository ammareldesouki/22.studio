import { describe, it, expect, vi, beforeEach } from 'vitest';
import { homepageService, HomepageError } from '.';

vi.mock('@studioflow/db', () => ({
  db: {
    homepageSection: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === 'function') return arg({ homepageSection: { update: vi.fn() } });
      if (Array.isArray(arg)) return Promise.all(arg.map((p: Promise<unknown>) => p));
      return undefined;
    }),
  },
}));

vi.mock('@studioflow/core/content-engine', () => ({
  slugify: vi.fn((title: string) => title.toLowerCase()),
  createWithUniqueSlug: vi.fn(
    <T>(_baseSlug: string, attempt: (slug: string) => Promise<T>) => attempt('hero'),
  ),
  assertVersionedUpdate: vi.fn((count: number) => {
    if (count === 0) throw new HomepageError('Version conflict', 'VERSION_CONFLICT', 409);
  }),
}));

const { db } = await import('@studioflow/db');

beforeEach(() => {
  vi.clearAllMocks();
});

function mockSection(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sec1',
    type: 'HERO',
    enabled: true,
    order: 0,
    config: {},
    slug: 'hero',
    version: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('HomepageService', () => {
  describe('create', () => {
    it('creates a HERO section', async () => {
      vi.mocked(db.homepageSection.create).mockResolvedValueOnce(mockSection() as never);
      const result = await homepageService.create({ type: 'HERO' });
      expect(result.type).toBe('HERO');
      expect(result.enabled).toBe(true);
    });
  });

  describe('update', () => {
    it('toggles enabled and updates config', async () => {
      vi.mocked(db.homepageSection.findUnique).mockResolvedValueOnce({ id: 'sec1', type: 'HERO' } as never);
      vi.mocked(db.homepageSection.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.homepageSection.findUniqueOrThrow).mockResolvedValueOnce(
        mockSection({ enabled: false, config: { headline: 'New' } }) as never,
      );
      const result = await homepageService.update('sec1', {
        enabled: false,
        config: { headline: 'New' },
        version: 1,
      });
      expect(result.enabled).toBe(false);
    });

    it('throws 409 on version conflict', async () => {
      vi.mocked(db.homepageSection.findUnique).mockResolvedValueOnce({ id: 'sec1', type: 'HERO' } as never);
      vi.mocked(db.homepageSection.updateMany).mockResolvedValueOnce({ count: 0 } as never);
      await expect(
        homepageService.update('sec1', { enabled: false, version: 1 }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'VERSION_CONFLICT' });
    });
  });

  describe('delete', () => {
    it('deletes a section', async () => {
      vi.mocked(db.homepageSection.findUnique).mockResolvedValueOnce({ id: 'sec1' } as never);
      vi.mocked(db.homepageSection.delete).mockResolvedValueOnce({} as never);
      await expect(homepageService.delete('sec1')).resolves.toBeUndefined();
    });

    it('throws 404 for missing section', async () => {
      vi.mocked(db.homepageSection.findUnique).mockResolvedValueOnce(null);
      await expect(homepageService.delete('missing')).rejects.toThrow(HomepageError);
    });
  });

  describe('reorder', () => {
    it('updates order for each id', async () => {
      vi.mocked(db.homepageSection.findMany).mockResolvedValueOnce([{ id: 'sec3' }, { id: 'sec1' }, { id: 'sec2' }] as never);
      vi.mocked(db.homepageSection.update).mockResolvedValue({} as never);
      await homepageService.reorder(['sec3', 'sec1', 'sec2']);
      expect(db.homepageSection.update).toHaveBeenCalledTimes(3);
      expect(db.homepageSection.update).toHaveBeenCalledWith({ where: { id: 'sec3' }, data: { order: 0 } });
      expect(db.homepageSection.update).toHaveBeenCalledWith({ where: { id: 'sec2' }, data: { order: 2 } });
    });

    it('rejects reorder with an unknown id (400, not 500)', async () => {
      vi.mocked(db.homepageSection.findMany).mockResolvedValueOnce([{ id: 'sec1' }] as never);
      await expect(homepageService.reorder(['sec1', 'ghost'])).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('list', () => {
    it('returns sections ordered by order asc', async () => {
      vi.mocked(db.homepageSection.findMany).mockResolvedValueOnce([
        mockSection({ id: 'sec1', order: 0 }),
        mockSection({ id: 'sec2', type: 'SERVICES', order: 1 }),
      ] as never);
      const result = await homepageService.list();
      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('sec1');
    });
  });

  describe('getById', () => {
    it('returns null for missing section', async () => {
      vi.mocked(db.homepageSection.findUnique).mockResolvedValueOnce(null);
      const result = await homepageService.getById('missing');
      expect(result).toBeNull();
    });
  });
});
