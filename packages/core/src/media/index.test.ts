import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mediaService, folderService } from '.';

vi.mock('@studioflow/db', () => ({
  db: {
    media: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    folder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const { db } = await import('@studioflow/db');

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn().mockResolvedValue({ ContentLength: 1000 }),
  })),
  PutObjectCommand: vi.fn(),
  HeadObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(() => Promise.resolve('https://presigned.example.com/upload')),
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.R2_ACCOUNT_ID = 'acct-123';
  process.env.R2_ACCESS_KEY_ID = 'key-123';
  process.env.R2_SECRET_ACCESS_KEY = 'secret-123';
  process.env.R2_BUCKET = 'studioflow';
  process.env.R2_PUBLIC_URL = 'https://media.example.com';
});

describe('MediaService', () => {
  describe('createUploadIntent', () => {
    it('creates a media row and returns presigned URL', async () => {
      vi.mocked(db.media.create).mockResolvedValueOnce({ id: 'm1' } as never);
      const result = await mediaService.createUploadIntent({
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 1024,
      });
      expect(result.mediaId).toBe('m1');
      expect(result.uploadUrl).toBe('https://presigned.example.com/upload');
      expect(db.media.create).toHaveBeenCalledOnce();
    });

    it('rejects unsupported content type with 422', async () => {
      await expect(
        mediaService.createUploadIntent({
          filename: 'file.exe',
          contentType: 'application/x-msdownload',
          size: 1024,
        }),
      ).rejects.toMatchObject({ statusCode: 422 });
    });

    it('rejects oversized image (>10MB) with 422', async () => {
      await expect(
        mediaService.createUploadIntent({
          filename: 'huge.jpg',
          contentType: 'image/jpeg',
          size: 11 * 1024 * 1024,
        }),
      ).rejects.toMatchObject({ statusCode: 422 });
    });

    it('rejects oversized video (>100MB) with 422', async () => {
      await expect(
        mediaService.createUploadIntent({
          filename: 'huge.mp4',
          contentType: 'video/mp4',
          size: 101 * 1024 * 1024,
        }),
      ).rejects.toMatchObject({ statusCode: 422 });
    });

    it('accepts valid video upload', async () => {
      vi.mocked(db.media.create).mockResolvedValueOnce({ id: 'm2' } as never);
      const result = await mediaService.createUploadIntent({
        filename: 'video.mp4',
        contentType: 'video/mp4',
        size: 50 * 1024 * 1024,
      });
      expect(result.mediaId).toBe('m2');
    });
  });

  describe('confirm', () => {
    it('throws 404 for non-existent media', async () => {
      vi.mocked(db.media.findUnique).mockResolvedValueOnce(null);
      await expect(mediaService.confirm('missing')).rejects.toThrow('Media not found');
    });

    it('confirms an existing media upload', async () => {
      vi.mocked(db.media.findUnique).mockResolvedValueOnce({ id: 'm1', r2Key: 'uploads/u1/photo.jpg' } as never);
      vi.mocked(db.media.findUniqueOrThrow).mockResolvedValueOnce({ id: 'm1', url: 'https://media.example.com/uploads/u1/photo.jpg' } as never);
      const result = await mediaService.confirm('m1');
      expect(result.id).toBe('m1');
    });
  });

  describe('list', () => {
    it('returns paginated results', async () => {
      const items = [
        { id: 'm1', createdAt: new Date('2026-01-01') },
        { id: 'm2', createdAt: new Date('2026-01-02') },
      ] as never[];
      vi.mocked(db.media.findMany).mockResolvedValueOnce(items);
      const result = await mediaService.list({ limit: 10 });
      expect(result.items).toHaveLength(2);
      expect(result.meta.cursor).toBe('m2');
    });

    it('only returns confirmed uploads (hides unconfirmed intents)', async () => {
      vi.mocked(db.media.findMany).mockResolvedValueOnce([] as never[]);
      await mediaService.list({ limit: 10 });
      const arg = vi.mocked(db.media.findMany).mock.calls[0]![0] as { where: Record<string, unknown> };
      expect(arg.where.confirmed).toBe(true);
    });
  });

  describe('update', () => {
    it('does not touch folderId when the caller omits it', async () => {
      vi.mocked(db.media.findUnique).mockResolvedValueOnce({ id: 'm1' } as never);
      vi.mocked(db.media.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.media.findUniqueOrThrow).mockResolvedValueOnce({ id: 'm1' } as never);
      await mediaService.update('m1', { tags: ['hero'], version: 1 });
      const arg = vi.mocked(db.media.updateMany).mock.calls[0]![0] as { data: Record<string, unknown> };
      expect(arg.data).not.toHaveProperty('folderId');
      expect(arg.data.tags).toEqual(['hero']);
    });

    it('clears folderId when explicitly set to null', async () => {
      vi.mocked(db.media.findUnique).mockResolvedValueOnce({ id: 'm1' } as never);
      vi.mocked(db.media.updateMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(db.media.findUniqueOrThrow).mockResolvedValueOnce({ id: 'm1' } as never);
      await mediaService.update('m1', { folderId: null, version: 1 });
      const arg = vi.mocked(db.media.updateMany).mock.calls[0]![0] as { data: Record<string, unknown> };
      expect(arg.data.folderId).toBeNull();
    });

    it('throws 409 on version conflict', async () => {
      vi.mocked(db.media.findUnique).mockResolvedValueOnce({ id: 'm1' } as never);
      vi.mocked(db.media.updateMany).mockResolvedValueOnce({ count: 0 } as never);
      await expect(mediaService.update('m1', { alt: 'x', version: 1 })).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('confirm sets confirmed flag', () => {
    it('marks the row confirmed', async () => {
      vi.mocked(db.media.findUnique).mockResolvedValueOnce({ id: 'm1', r2Key: 'uploads/u1/p.jpg' } as never);
      vi.mocked(db.media.findUniqueOrThrow).mockResolvedValueOnce({ id: 'm1', confirmed: true } as never);
      await mediaService.confirm('m1');
      const arg = vi.mocked(db.media.update).mock.calls[0]![0] as { data: Record<string, unknown> };
      expect(arg.data.confirmed).toBe(true);
    });
  });

  describe('delete', () => {
    it('blocks delete when usageCount > 0', async () => {
      vi.mocked(db.media.findUnique).mockResolvedValueOnce({ id: 'm1', usageCount: 2, r2Key: 'key' } as never);
      await expect(mediaService.delete('m1')).rejects.toThrow('usageCount 2');
    });

    it('deletes when usageCount is 0', async () => {
      vi.mocked(db.media.findUnique).mockResolvedValueOnce({ id: 'm1', usageCount: 0, r2Key: 'key' } as never);
      vi.mocked(db.media.delete).mockResolvedValueOnce({} as never);
      await mediaService.delete('m1');
      expect(db.media.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    });
  });
});

describe('FolderService', () => {
  describe('create', () => {
    it('creates a folder with name', async () => {
      vi.mocked(db.folder.create).mockResolvedValueOnce({ id: 'f1', name: 'Photos' } as never);
      const result = await folderService.create({ name: 'Photos' });
      expect(result.name).toBe('Photos');
    });
  });

  describe('delete', () => {
    it('blocks deleting a non-empty folder', async () => {
      vi.mocked(db.folder.findUnique).mockResolvedValueOnce({ id: 'f1' } as never);
      vi.mocked(db.media.count).mockResolvedValueOnce(3);
      await expect(folderService.delete('f1')).rejects.toThrow('Cannot delete folder with media');
    });
  });
});
