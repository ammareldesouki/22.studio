import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectsService, ProjectsError } from '.';

const mockTx = {
  project: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    delete: vi.fn(),
  },
  projectMedia: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
  projectService: {
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
  relatedProject: {
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
  media: {
    update: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock('@studioflow/db', () => ({
  db: {
    project: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    projectMedia: {
      findMany: vi.fn(),
    },
    media: {
      findMany: vi.fn(),
    },
    service: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
  },
}));

const { db } = await import('@studioflow/db');

vi.mock('@studioflow/core/content-engine', () => ({
  slugify: vi.fn((title: string) => title.toLowerCase().replace(/\s+/g, '-')),
  createWithUniqueSlug: vi.fn(
    <T>(_baseSlug: string, attempt: (slug: string) => Promise<T>) => attempt('test-project'),
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
  assertVersionedUpdate: vi.fn((count: number) => {
    if (count === 0) throw new Error('Version conflict');
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function mockProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    title: 'Test Project',
    slug: 'test-project',
    status: 'DRAFT',
    featured: false,
    overview: null,
    description: null,
    challenge: null,
    solution: null,
    results: null,
    externalLinks: [],
    clientId: null,
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

describe('ProjectsService', () => {
  describe('create', () => {
    it('creates a title-only project as Draft', async () => {
      mockTx.project.create.mockResolvedValueOnce(mockProject());
      const result = await projectsService.create({
        title: 'Test Project',
        mediaRefs: [],
        serviceIds: [],
        relatedIds: [],
      });
      expect(result.title).toBe('Test Project');
      expect(result.status).toBe('DRAFT');
    });

    it('increments media usageCount for each ref', async () => {
      vi.mocked(db.media.findMany).mockResolvedValueOnce([{ id: 'm1' }, { id: 'm2' }] as never);
      mockTx.project.create.mockResolvedValueOnce(mockProject());
      await projectsService.create({
        title: 'With Media',
        mediaRefs: [
          { mediaId: 'm1', type: 'GALLERY' as const },
          { mediaId: 'm2', type: 'VIDEO' as const },
        ],
        serviceIds: [],
        relatedIds: [],
      });
      expect(mockTx.media.update).toHaveBeenCalledTimes(2);
    });

    it('de-duplicates identical media refs (no PK collision)', async () => {
      vi.mocked(db.media.findMany).mockResolvedValueOnce([{ id: 'm1' }] as never);
      mockTx.project.create.mockResolvedValueOnce(mockProject());
      await projectsService.create({
        title: 'Dup Media',
        mediaRefs: [
          { mediaId: 'm1', type: 'GALLERY' as const },
          { mediaId: 'm1', type: 'GALLERY' as const },
        ],
      });
      expect(mockTx.media.update).toHaveBeenCalledTimes(1);
    });

    it('rejects an unknown media reference with 400', async () => {
      vi.mocked(db.media.findMany).mockResolvedValueOnce([] as never);
      await expect(
        projectsService.create({ title: 'Bad Ref', mediaRefs: [{ mediaId: 'ghost', type: 'GALLERY' as const }] }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('update', () => {
    it('replaces only outgoing related links (keeps other projects\' links)', async () => {
      vi.mocked(db.project.findUnique).mockResolvedValueOnce({ id: 'p1', slug: 'test' } as never);
      mockTx.project.updateMany.mockResolvedValueOnce({ count: 1 } as never);
      mockTx.project.findUniqueOrThrow.mockResolvedValueOnce(mockProject());
      vi.mocked(db.project.findMany).mockResolvedValueOnce([{ id: 'p2' }] as never);
      await projectsService.update('p1', { relatedIds: ['p2'], version: 1 });
      expect(mockTx.relatedProject.deleteMany).toHaveBeenCalledWith({ where: { projectId: 'p1' } });
    });

    it('rejects a colliding manual slug with 409', async () => {
      vi.mocked(db.project.findUnique).mockResolvedValueOnce({ id: 'p1', slug: 'test' } as never);
      vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'other' } as never);
      await expect(
        projectsService.update('p1', { slug: 'taken', version: 1 }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'SLUG_TAKEN' });
    });
  });

  describe('updateStatus', () => {
    it('publishes a draft and stamps publishedAt', async () => {
      vi.mocked(db.project.findUnique).mockResolvedValueOnce({ id: 'p1', status: 'DRAFT', publishedAt: null } as never);
      vi.mocked(db.project.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.project.findUniqueOrThrow).mockResolvedValueOnce(mockProject({ status: 'PUBLISHED', publishedAt: new Date() }) as never);
      const result = await projectsService.updateStatus('p1', 'publish', 1);
      expect(result.status).toBe('PUBLISHED');
    });

    it('archives a published project', async () => {
      vi.mocked(db.project.findUnique).mockResolvedValueOnce({ id: 'p1', status: 'PUBLISHED', publishedAt: new Date() } as never);
      vi.mocked(db.project.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.project.findUniqueOrThrow).mockResolvedValueOnce(mockProject({ status: 'ARCHIVED' }) as never);
      const result = await projectsService.updateStatus('p1', 'archive', 1);
      expect(result.status).toBe('ARCHIVED');
    });

    it('restores an archived project to Draft', async () => {
      vi.mocked(db.project.findUnique).mockResolvedValueOnce({ id: 'p1', status: 'ARCHIVED', publishedAt: null } as never);
      vi.mocked(db.project.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.project.findUniqueOrThrow).mockResolvedValueOnce(mockProject({ status: 'DRAFT' }) as never);
      const result = await projectsService.updateStatus('p1', 'restore', 1);
      expect(result.status).toBe('DRAFT');
    });

    it('maps an invalid transition to a 409 ProjectsError (not a raw 500)', async () => {
      vi.mocked(db.project.findUnique).mockResolvedValueOnce({ id: 'p1', status: 'DRAFT', publishedAt: null } as never);
      // applyTransition mock throws for an unknown action → service must translate it.
      await expect(
        projectsService.updateStatus('p1', 'bogus' as never, 1),
      ).rejects.toMatchObject({ statusCode: 409, code: 'INVALID_TRANSITION' });
    });

    it('throws 409 (not 500) on a stale-version status change', async () => {
      vi.mocked(db.project.findUnique).mockResolvedValueOnce({ id: 'p1', status: 'DRAFT', publishedAt: null } as never);
      vi.mocked(db.project.updateMany).mockResolvedValueOnce({ count: 0 } as never);
      await expect(
        projectsService.updateStatus('p1', 'publish', 1),
      ).rejects.toMatchObject({ statusCode: 409, code: 'VERSION_CONFLICT' });
    });
  });

  describe('delete', () => {
    it('decrements usageCount for each media ref before deleting', async () => {
      vi.mocked(db.project.findUnique).mockResolvedValueOnce({ id: 'p1' } as never);
      mockTx.projectMedia.findMany.mockResolvedValueOnce([
        { mediaId: 'm1' },
        { mediaId: 'm2' },
      ]);
      await projectsService.delete('p1');
      expect(mockTx.media.updateMany).toHaveBeenCalledTimes(2);
      expect(mockTx.project.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });

    it('throws 404 for missing project', async () => {
      vi.mocked(db.project.findUnique).mockResolvedValueOnce(null);
      await expect(projectsService.delete('missing')).rejects.toThrow(ProjectsError);
    });
  });

  describe('optimistic concurrency', () => {
    it('throws 409 on version conflict', async () => {
      vi.mocked(db.project.findUnique).mockResolvedValueOnce({ id: 'p1', slug: 'test' } as never);
      mockTx.project.updateMany.mockResolvedValueOnce({ count: 0 } as never);
      mockTx.project.findUniqueOrThrow.mockResolvedValueOnce({} as never);
      await expect(
        projectsService.update('p1', { title: 'New Title', version: 1 }),
      ).rejects.toThrow('Version conflict');
    });
  });
});
