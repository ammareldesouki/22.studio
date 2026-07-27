import { z } from 'zod';

// Type/size limits are enforced in @studioflow/core/media (returns 422). These lists are
// exported for reuse by the service and any UI that wants to surface the allowed types.
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
] as const;

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const;

export const ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
] as const;

// Structural validation only. Media-type and size rules live in the service so an
// invalid type/size returns 422 (per contracts/media.md), not the wrapper's 400.
export const uploadIntentSchema = z.object({
  filename: z.string().min(1).max(500),
  contentType: z.string().min(1).max(255),
  size: z.number().int().positive(),
  folderId: z.string().uuid().optional().nullable(),
  alt: z.string().max(500).optional(),
});

export const updateMediaSchema = z.object({
  alt: z.string().max(500).optional(),
  tags: z.array(z.string().max(100)).optional(),
  folderId: z.string().uuid().nullable().optional(),
  version: z.number().int().positive(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1).max(200),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  parentId: z.string().uuid().nullable().optional(),
});
