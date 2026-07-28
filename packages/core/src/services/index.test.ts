import { describe, it, expect, vi, beforeEach } from 'vitest';
import { servicesService } from '.';

vi.mock('@studioflow/db', () => ({
  db: {
    service: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subService: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === 'function') return arg({ service: { update: vi.fn() } });
      if (Array.isArray(arg)) return Promise.all(arg.map((p: Promise<unknown>) => p));
      return undefined;
    }),
  },
}));

vi.mock('@studioflow/core/content-engine', () => ({
  slugify: vi.fn((title: string) => title.toLowerCase().replace(/\s+/g, '-')),
  createWithUniqueSlug: vi.fn(
    <T>(_baseSlug: string, attempt: (slug: string) => Promise<T>) => attempt('test-service'),
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

function mockService(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    name: 'Test Service',
    slug: 'test-service',
    description: null,
    iconMediaId: null,
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

describe('ServicesService', () => {
  describe('create', () => {
    it('creates a service as Draft', async () => {
      vi.mocked(db.service.create).mockResolvedValueOnce(mockService() as never);
      const result = await servicesService.create({ name: 'Test Service' });
      expect(result.name).toBe('Test Service');
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('update', () => {
    it('updates a service name', async () => {
      vi.mocked(db.service.findUnique).mockResolvedValueOnce({ id: 's1', slug: 'test-service' } as never);
      vi.mocked(db.service.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.service.findUniqueOrThrow).mockResolvedValueOnce(mockService({ name: 'Updated' }) as never);
      const result = await servicesService.update('s1', { name: 'Updated', version: 1 });
      expect(result.name).toBe('Updated');
    });

    it('rejects a colliding manual slug with 409', async () => {
      vi.mocked(db.service.findUnique).mockResolvedValueOnce({ id: 's1', slug: 'test-service' } as never);
      vi.mocked(db.service.findFirst).mockResolvedValueOnce({ id: 'other' } as never);
      await expect(
        servicesService.update('s1', { slug: 'taken', version: 1 }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'SLUG_TAKEN' });
    });

    it('throws 409 (not 500) on a stale-version update', async () => {
      vi.mocked(db.service.findUnique).mockResolvedValueOnce({ id: 's1', slug: 'test-service' } as never);
      vi.mocked(db.service.updateMany).mockResolvedValueOnce({ count: 0 } as never);
      await expect(
        servicesService.update('s1', { name: 'X', version: 1 }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'VERSION_CONFLICT' });
    });
  });

  describe('updateStatus', () => {
    it('publishes a draft', async () => {
      vi.mocked(db.service.findUnique).mockResolvedValueOnce({ id: 's1', status: 'DRAFT', publishedAt: null } as never);
      vi.mocked(db.service.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.service.findUniqueOrThrow).mockResolvedValueOnce(mockService({ status: 'PUBLISHED' }) as never);
      const result = await servicesService.updateStatus('s1', 'publish', 1);
      expect(result.status).toBe('PUBLISHED');
    });

    it('archives a service', async () => {
      vi.mocked(db.service.findUnique).mockResolvedValueOnce({ id: 's1', status: 'PUBLISHED', publishedAt: new Date() } as never);
      vi.mocked(db.service.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.service.findUniqueOrThrow).mockResolvedValueOnce(mockService({ status: 'ARCHIVED' }) as never);
      const result = await servicesService.updateStatus('s1', 'archive', 1);
      expect(result.status).toBe('ARCHIVED');
    });

    it('throws 409 on version conflict', async () => {
      vi.mocked(db.service.findUnique).mockResolvedValueOnce({ id: 's1', status: 'DRAFT', publishedAt: null } as never);
      vi.mocked(db.service.updateMany).mockResolvedValueOnce({ count: 0 } as never);
      await expect(
        servicesService.updateStatus('s1', 'publish', 1),
      ).rejects.toMatchObject({ statusCode: 409, code: 'VERSION_CONFLICT' });
    });
  });

  describe('delete', () => {
    it('deletes a service with no references', async () => {
      vi.mocked(db.service.findUnique).mockResolvedValueOnce({ id: 's1' } as never);
      vi.mocked(db.service.delete).mockResolvedValueOnce({} as never);
      await expect(servicesService.delete('s1')).resolves.toBeUndefined();
    });

    it('throws 409 when FK violation occurs', async () => {
      vi.mocked(db.service.findUnique).mockResolvedValueOnce({ id: 's1' } as never);
      const fkError = Object.assign(new Error('Foreign key violation'), { code: 'P2003' });
      vi.mocked(db.service.delete).mockRejectedValueOnce(fkError);
      await expect(servicesService.delete('s1')).rejects.toMatchObject({ statusCode: 409, code: 'IN_USE' });
    });
  });

  describe('reorder', () => {
    it('updates order for each id', async () => {
      vi.mocked(db.service.findMany).mockResolvedValueOnce([{ id: 's3' }, { id: 's1' }, { id: 's2' }] as never);
      vi.mocked(db.service.update).mockResolvedValue({} as never);
      await servicesService.reorder(['s3', 's1', 's2']);
      expect(db.service.update).toHaveBeenCalledTimes(3);
      expect(db.service.update).toHaveBeenCalledWith({ where: { id: 's3' }, data: { order: 0 } });
      expect(db.service.update).toHaveBeenCalledWith({ where: { id: 's2' }, data: { order: 2 } });
    });
  });

  describe('SubServices', () => {
    it('creates a sub-service under a service', async () => {
      vi.mocked(db.service.findUnique).mockResolvedValueOnce({ id: 's1' } as never);
      vi.mocked(db.subService.create).mockResolvedValueOnce({ id: 'ss1', name: 'Sub', description: null, order: 0, serviceId: 's1', createdAt: new Date(), updatedAt: new Date() });
      const result = await servicesService.createSubService('s1', { name: 'Sub' });
      expect(result.name).toBe('Sub');
    });

    it('throws 404 when parent service is missing', async () => {
      vi.mocked(db.service.findUnique).mockResolvedValueOnce(null);
      await expect(
        servicesService.createSubService('ghost', { name: 'Sub' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('deletes a sub-service', async () => {
      vi.mocked(db.subService.findUnique).mockResolvedValueOnce({ id: 'ss1', name: 'Sub', description: null, order: 0, serviceId: 's1', createdAt: new Date(), updatedAt: new Date() } as never);
      vi.mocked(db.subService.delete).mockResolvedValueOnce({} as never);
      await expect(servicesService.deleteSubService('ss1')).resolves.toBeUndefined();
    });

    it('updates a sub-service', async () => {
      vi.mocked(db.subService.findUnique).mockResolvedValueOnce({ id: 'ss1', name: 'Sub', description: null, order: 0, serviceId: 's1', createdAt: new Date(), updatedAt: new Date() } as never);
      vi.mocked(db.subService.update).mockResolvedValueOnce({ id: 'ss1', name: 'Updated', description: null, order: 0, serviceId: 's1', createdAt: new Date(), updatedAt: new Date() });
      const result = await servicesService.updateSubService('ss1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('list', () => {
    it('returns paginated services', async () => {
      vi.mocked(db.service.findMany).mockResolvedValueOnce([
        mockService(),
        mockService({ id: 's2', name: 'Service 2' }),
      ] as never);
      const result = await servicesService.list({ limit: 10 });
      expect(result.items).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('returns null for missing service', async () => {
      vi.mocked(db.service.findUnique).mockResolvedValueOnce(null);
      const result = await servicesService.getById('missing');
      expect(result).toBeNull();
    });
  });
});
