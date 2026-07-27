import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';
import { db } from '@studioflow/db';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@studioflow/types';

// ── R2 client (lazy singleton) ────────────────────────────────────────────

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new MediaError('R2 credentials not configured', 'R2_CONFIG_ERROR', 500);
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucket(): string {
  return process.env.R2_BUCKET ?? 'studioflow';
}

function getPublicUrl(): string {
  return process.env.R2_PUBLIC_URL ?? '';
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface UploadIntentResult {
  mediaId: string;
  uploadUrl: string;
}

export interface MediaRecord {
  id: string;
  type: string;
  r2Key: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  folderId: string | null;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderRecord {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaPage {
  items: MediaRecord[];
  meta: { cursor: string | null; hasMore: boolean; limit: number };
}

// ── MIME → MediaType mapping ───────────────────────────────────────────────

const MIME_TO_TYPE: Record<string, string> = {
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
  'image/avif': 'IMAGE',
  'image/svg+xml': 'IMAGE',
  'video/mp4': 'VIDEO',
  'video/webm': 'VIDEO',
};

const ALLOWED_MIME_TYPES = new Set(Object.keys(MIME_TO_TYPE));

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

function isImageMime(contentType: string): boolean {
  return contentType.startsWith('image/');
}

// ── Service ────────────────────────────────────────────────────────────────

export class MediaService {
  async createUploadIntent(input: {
    filename: string;
    contentType: string;
    size: number;
    folderId?: string | null;
    alt?: string | null;
  }): Promise<UploadIntentResult> {
    if (!ALLOWED_MIME_TYPES.has(input.contentType)) {
      throw new MediaError('Unsupported media type', 'INVALID_TYPE', 422);
    }

    if (isImageMime(input.contentType) && input.size > MAX_IMAGE_SIZE) {
      throw new MediaError(
        `Image size exceeds maximum of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
        'SIZE_EXCEEDED',
        422,
      );
    }
    if (!isImageMime(input.contentType) && input.size > MAX_VIDEO_SIZE) {
      throw new MediaError(
        `Video size exceeds maximum of ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`,
        'SIZE_EXCEEDED',
        422,
      );
    }

    const r2Key = `uploads/${crypto.randomUUID()}/${input.filename}`;
    const publicUrl = getPublicUrl();
    const url = publicUrl ? `${publicUrl}/${r2Key}` : `https://${getBucket()}.r2.cloudflarestorage.com/${r2Key}`;
    const mediaType = MIME_TO_TYPE[input.contentType] ?? 'IMAGE';

    const media = await db.media.create({
      data: {
        type: mediaType as never,
        r2Key,
        url,
        alt: input.alt ?? null,
        folderId: input.folderId ?? null,
      },
    });

    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: getBucket(),
      Key: r2Key,
      ContentType: input.contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    return { mediaId: media.id, uploadUrl };
  }

  async confirm(mediaId: string): Promise<MediaRecord> {
    const media = await db.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new MediaError('Media not found', 'NOT_FOUND', 404);
    }

    try {
      const client = getR2Client();
      const head = await client.send(
        new HeadObjectCommand({ Bucket: getBucket(), Key: media.r2Key }),
      );

      // File exists in R2 (HeadObject succeeded) → finalize the row. Real image dimension
      // extraction is a follow-up; leave width/height null rather than fabricating them.
      void head;
      await db.media.update({
        where: { id: mediaId },
        data: { confirmed: true },
      });
    } catch {
      throw new MediaError('Upload not found — file was not uploaded to storage', 'UPLOAD_MISSING', 422);
    }

    return db.media.findUniqueOrThrow({ where: { id: mediaId } });
  }

  async list(params: {
    cursor?: string;
    limit?: number;
    folderId?: string;
    tag?: string;
    type?: string;
  }): Promise<MediaPage> {
    const limit = Math.min(Math.max(params.limit ?? DEFAULT_PAGE_LIMIT, 1), MAX_PAGE_LIMIT);
    // Only finalized uploads are part of the library; unconfirmed intents stay hidden.
    const where: Record<string, unknown> = { confirmed: true };
    if (params.folderId) where.folderId = params.folderId;
    if (params.tag) where.tags = { has: params.tag };
    if (params.type) where.type = params.type;

    const items = await db.media.findMany({
      where: where as never,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit + 1,
      ...(params.cursor
        ? { cursor: { id: params.cursor }, skip: 1 }
        : {}),
    });

    const hasMore = items.length > limit;
    const sliced = hasMore ? items.slice(0, limit) : items;
    const last = sliced[sliced.length - 1];

    return {
      items: sliced,
      meta: { cursor: last ? last.id : null, hasMore, limit },
    };
  }

  async getById(id: string): Promise<MediaRecord | null> {
    return db.media.findUnique({ where: { id } });
  }

  async update(id: string, input: { alt?: string; tags?: string[]; folderId?: string | null; version: number }): Promise<MediaRecord> {
    const current = await db.media.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw new MediaError('Media not found', 'NOT_FOUND', 404);

    // Partial update: only touch fields the caller actually sent. `'key' in input`
    // distinguishes "omitted" (leave as-is) from "explicitly set to null" (clear).
    const data: Record<string, unknown> = { version: { increment: 1 } };
    if (input.alt !== undefined) data.alt = input.alt;
    if (input.tags !== undefined) data.tags = input.tags;
    if ('folderId' in input) data.folderId = input.folderId ?? null;

    const { count } = await db.media.updateMany({
      where: { id, version: input.version },
      data: data as never,
    });
    if (count === 0) {
      throw new MediaError('Version conflict', 'VERSION_CONFLICT', 409);
    }
    return db.media.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    const media = await db.media.findUnique({ where: { id }, select: { id: true, usageCount: true, r2Key: true } });
    if (!media) throw new MediaError('Media not found', 'NOT_FOUND', 404);

    if (media.usageCount > 0) {
      throw new MediaError(
        `Cannot delete media with usageCount ${media.usageCount} — it is referenced by one or more entities`,
        'IN_USE',
        409,
      );
    }

    const client = getR2Client();
    try {
      await client.send(
        new DeleteObjectCommand({ Bucket: getBucket(), Key: media.r2Key }),
      );
    } catch {
      // Best-effort deletion from R2; row deletion still proceeds.
    }

    await db.media.delete({ where: { id } });
  }
}

export class FolderService {
  async list(): Promise<FolderRecord[]> {
    return db.folder.findMany({ orderBy: { name: 'asc' } });
  }

  async getById(id: string): Promise<FolderRecord | null> {
    return db.folder.findUnique({ where: { id } });
  }

  async create(input: { name: string; parentId?: string | null }): Promise<FolderRecord> {
    return db.folder.create({
      data: {
        name: input.name,
        parentId: input.parentId ?? null,
      },
    });
  }

  async update(id: string, input: { name?: string; parentId?: string | null }): Promise<FolderRecord> {
    const current = await db.folder.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw new MediaError('Folder not found', 'NOT_FOUND', 404);

    // Partial update: only touch fields the caller actually sent (see MediaService.update).
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if ('parentId' in input) data.parentId = input.parentId ?? null;

    return db.folder.update({ where: { id }, data: data as never });
  }

  async delete(id: string): Promise<void> {
    const folder = await db.folder.findUnique({ where: { id }, select: { id: true } });
    if (!folder) throw new MediaError('Folder not found', 'NOT_FOUND', 404);

    const mediaCount = await db.media.count({ where: { folderId: id } });
    if (mediaCount > 0) {
      throw new MediaError(
        'Cannot delete folder with media — reassign or delete media first',
        'FOLDER_NOT_EMPTY',
        409,
      );
    }

    await db.folder.delete({ where: { id } });
  }
}

export class MediaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'MediaError';
  }
}

export const mediaService = new MediaService();
export const folderService = new FolderService();
