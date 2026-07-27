import { z } from 'zod';
import { ALL_PERMISSIONS } from '@studioflow/types';

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum(ALL_PERMISSIONS as unknown as [string, ...string[]])),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.enum(ALL_PERMISSIONS as unknown as [string, ...string[]])).optional(),
  version: z.number().int().positive(),
});
