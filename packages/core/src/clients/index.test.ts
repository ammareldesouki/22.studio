import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientsService, ClientsError } from '.';

vi.mock('@studioflow/db', () => ({
  db: {
    client: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === 'function') return arg({ client: { update: vi.fn() } });
      if (Array.isArray(arg)) return Promise.all(arg.map((p: Promise<unknown>) => p));
      return undefined;
    }),
  },
}));

vi.mock('@studioflow/core/content-engine', () => ({
  slugify: vi.fn((title: string) => title.toLowerCase().replace(/\s+/g, '-')),
  createWithUniqueSlug: vi.fn(
    <T>(_baseSlug: string, attempt: (slug: string) => Promise<T>) => attempt('test-client'),
  ),
  seoToColumns: vi.fn(() => ({})),
  columnsToSeo: vi.fn(() => ({})),
  applyTransition: vi.fn((_current: string, action: string) => {
    if (action === 'publish') return 'PUBLISHED';
    if (action === 'archive') return 'ARCHIVED';
    if (action === 'unpublish') return 'DRAFT';
    if (action === 'restore') return 'DRAFT';
    throw new Error('Invalid transition');
  }),
  shouldStampPublishedAt: vi.fn((current: string, next: string) => {
    return current !== 'PUBLISHED' && next === 'PUBLISHED';
  }),
  isForeignKeyViolation: (e: unknown) =>
    typeof e === 'object' && e !== null && 'code' in e && (e as { code?: unknown }).code === 'P2003',
}));

const { db } = await import('@studioflow/db');

beforeEach(() => {
  vi.clearAllMocks();
});

function mockClient(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    name: 'Test Client',
    slug: 'test-client',
    logoId: null,
    website: null,
    order: 0,
    status: 'DRAFT',
    featured: false,
    seoTitle: null,
    seoMetaDescription: null,
    seoCanonicalUrl: null,
    seoOgImage: null,
    seoTwitterCard: null,
    seoStructuredData: null,
    seoRobots: null,
    version: 1,
    publishedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('ClientsService', () => {
  describe('create', () => {
    it('creates a client as Draft', async () => {
      vi.mocked(db.client.create).mockResolvedValueOnce(mockClient() as never);
      const result = await clientsService.create({ name: 'Test Client' });
      expect(result.name).toBe('Test Client');
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('update', () => {
    it('renames a client', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValueOnce({ id: 'c1', slug: 'test-client' } as never);
      vi.mocked(db.client.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.client.findUniqueOrThrow).mockResolvedValueOnce(mockClient({ name: 'Renamed' }) as never);
      const result = await clientsService.update('c1', { name: 'Renamed', version: 1 });
      expect(result.name).toBe('Renamed');
    });

    it('rejects a colliding manual slug with 409', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValueOnce({ id: 'c1', slug: 'test-client' } as never);
      vi.mocked(db.client.findFirst).mockResolvedValueOnce({ id: 'other' } as never);
      await expect(
        clientsService.update('c1', { slug: 'taken', version: 1 }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'SLUG_TAKEN' });
    });

    it('throws 409 (not 500) on a stale-version update', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValueOnce({ id: 'c1', slug: 'test-client' } as never);
      vi.mocked(db.client.updateMany).mockResolvedValueOnce({ count: 0 } as never);
      await expect(
        clientsService.update('c1', { name: 'X', version: 1 }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'VERSION_CONFLICT' });
    });
  });

  describe('updateStatus', () => {
    it('publishes a draft and stamps publishedAt', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValueOnce({ id: 'c1', status: 'DRAFT', publishedAt: null } as never);
      vi.mocked(db.client.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.client.findUniqueOrThrow).mockResolvedValueOnce(mockClient({ status: 'PUBLISHED', publishedAt: new Date() }) as never);
      const result = await clientsService.updateStatus('c1', 'publish', 1);
      expect(result.status).toBe('PUBLISHED');
    });

    it('archives a client', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValueOnce({ id: 'c1', status: 'PUBLISHED', publishedAt: new Date() } as never);
      vi.mocked(db.client.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.client.findUniqueOrThrow).mockResolvedValueOnce(mockClient({ status: 'ARCHIVED' }) as never);
      const result = await clientsService.updateStatus('c1', 'archive', 1);
      expect(result.status).toBe('ARCHIVED');
    });

    it('maps an invalid transition to a 409', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValueOnce({ id: 'c1', status: 'DRAFT', publishedAt: null } as never);
      await expect(
        clientsService.updateStatus('c1', 'bogus' as never, 1),
      ).rejects.toMatchObject({ statusCode: 409, code: 'INVALID_TRANSITION' });
    });

    it('throws 409 on version conflict', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValueOnce({ id: 'c1', status: 'DRAFT', publishedAt: null } as never);
      vi.mocked(db.client.updateMany).mockResolvedValueOnce({ count: 0 } as never);
      await expect(
        clientsService.updateStatus('c1', 'publish', 1),
      ).rejects.toMatchObject({ statusCode: 409, code: 'VERSION_CONFLICT' });
    });
  });

  describe('delete', () => {
    it('deletes a client with no references', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValueOnce({ id: 'c1' } as never);
      vi.mocked(db.client.delete).mockResolvedValueOnce({} as never);
      await expect(clientsService.delete('c1')).resolves.toBeUndefined();
    });

    it('throws 404 for missing client', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValueOnce(null);
      await expect(clientsService.delete('missing')).rejects.toThrow(ClientsError);
    });

    it('throws 409 when FK violation occurs', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValueOnce({ id: 'c1' } as never);
      const fkError = Object.assign(new Error('Foreign key violation'), { code: 'P2003' });
      vi.mocked(db.client.delete).mockRejectedValueOnce(fkError);
      await expect(clientsService.delete('c1')).rejects.toMatchObject({ statusCode: 409, code: 'IN_USE' });
    });
  });

  describe('reorder', () => {
    it('updates order for each id', async () => {
      vi.mocked(db.client.findMany).mockResolvedValueOnce([{ id: 'c3' }, { id: 'c1' }, { id: 'c2' }] as never);
      vi.mocked(db.client.update).mockResolvedValue({} as never);
      await clientsService.reorder(['c3', 'c1', 'c2']);
      expect(db.client.update).toHaveBeenCalledTimes(3);
      expect(db.client.update).toHaveBeenCalledWith({ where: { id: 'c3' }, data: { order: 0 } });
      expect(db.client.update).toHaveBeenCalledWith({ where: { id: 'c2' }, data: { order: 2 } });
    });

    it('rejects reorder with an unknown id (400, not 500)', async () => {
      vi.mocked(db.client.findMany).mockResolvedValueOnce([{ id: 'c1' }] as never);
      await expect(clientsService.reorder(['c1', 'ghost'])).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('list', () => {
    it('returns paginated clients', async () => {
      vi.mocked(db.client.findMany).mockResolvedValueOnce([
        mockClient(),
        mockClient({ id: 'c2', name: 'Client 2' }),
      ] as never);
      const result = await clientsService.list({ limit: 10 });
      expect(result.items).toHaveLength(2);
      expect(result.meta.hasMore).toBe(false);
    });
  });

  describe('getById', () => {
    it('returns null for missing client', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValueOnce(null);
      const result = await clientsService.getById('missing');
      expect(result).toBeNull();
    });
  });
});
