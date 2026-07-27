import { db } from '@studioflow/db';
import { ALL_PERMISSIONS } from '@studioflow/types';

// ── Types ────────────────────────────────────────────────────────────────

export interface CreateRoleInput {
  name: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  name?: string;
  permissions?: string[];
  version: number;
}

export interface RoleRecord {
  id: string;
  name: string;
  permissions: string[];
  isOwner: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Service ──────────────────────────────────────────────────────────────

export class RolesService {
  async list(): Promise<RoleRecord[]> {
    return db.role.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async getById(id: string): Promise<RoleRecord | null> {
    return db.role.findUnique({ where: { id } });
  }

  async create(input: CreateRoleInput): Promise<RoleRecord> {
    this.validatePermissions(input.permissions);

    const existing = await db.role.findUnique({ where: { name: input.name } });
    if (existing) {
      throw new RolesError('Role name already exists', 'NAME_TAKEN', 409);
    }

    return db.role.create({
      data: {
        name: input.name,
        permissions: input.permissions as unknown as string[],
      },
    });
  }

  async update(id: string, input: UpdateRoleInput): Promise<RoleRecord> {
    const current = await db.role.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw new RolesError('Role not found', 'NOT_FOUND', 404);

    if (input.permissions) {
      this.validatePermissions(input.permissions);
    }

    // Atomic optimistic-concurrency: conditional update on the expected version.
    const { count } = await db.role.updateMany({
      where: { id, version: input.version },
      data: {
        name: input.name,
        permissions: input.permissions,
        version: { increment: 1 },
      },
    });
    if (count === 0) {
      throw new RolesError('Version conflict', 'VERSION_CONFLICT', 409);
    }
    return db.role.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    const role = await db.role.findUnique({ where: { id } });
    if (!role) throw new RolesError('Role not found', 'NOT_FOUND', 404);
    if (role.isOwner) {
      throw new RolesError('Cannot delete the immutable owner role', 'OWNER_IMMUTABLE', 409);
    }

    const assignedCount = await db.user.count({ where: { roleId: id } });
    if (assignedCount > 0) {
      throw new RolesError(
        'Cannot delete role with assigned users — reassign users first',
        'ROLE_ASSIGNED',
        409,
      );
    }

    await db.role.delete({ where: { id } });
  }

  async getCatalog(): Promise<readonly string[]> {
    return ALL_PERMISSIONS as readonly string[];
  }

  private validatePermissions(permissions: string[]): void {
    const catalog = ALL_PERMISSIONS as readonly string[];
    for (const p of permissions) {
      if (!catalog.includes(p)) {
        throw new RolesError(`Invalid permission: ${p}`, 'INVALID_PERMISSION', 422);
      }
    }
  }
}

export class RolesError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'RolesError';
  }
}

export const rolesService = new RolesService();
