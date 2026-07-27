import { db } from '@studioflow/db';
import { hashPassword } from '../auth';
import { refreshTokenStore } from '../auth/store';

// ── Types ────────────────────────────────────────────────────────────────

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleId: string;
}

export interface UpdateUserInput {
  name?: string;
  roleId?: string;
  active?: boolean;
  version: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  roleId: string;
  active: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Public projection — NEVER select passwordHash into anything returned to callers.
const userSelect = {
  id: true,
  name: true,
  email: true,
  roleId: true,
  active: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ── Service ──────────────────────────────────────────────────────────────

export class UsersService {
  async list(): Promise<UserRecord[]> {
    return db.user.findMany({ orderBy: { createdAt: 'asc' }, select: userSelect });
  }

  async getById(id: string): Promise<UserRecord | null> {
    return db.user.findUnique({ where: { id }, select: userSelect });
  }

  /** Includes passwordHash — for internal auth verification ONLY, never returned to clients. */
  async getByEmail(email: string): Promise<(UserRecord & { passwordHash: string }) | null> {
    return db.user.findUnique({ where: { email } });
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const existing = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (existing) {
      throw new UsersError('Email already in use', 'EMAIL_TAKEN', 409);
    }
    const role = await db.role.findUnique({ where: { id: input.roleId }, select: { id: true } });
    if (!role) {
      throw new UsersError('Role does not exist', 'INVALID_ROLE', 422);
    }
    const passwordHash = await hashPassword(input.password);
    return db.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        roleId: input.roleId,
      },
      select: userSelect,
    });
  }

  async update(id: string, input: UpdateUserInput): Promise<UserRecord> {
    const current = await db.user.findUnique({ where: { id }, select: { id: true, active: true } });
    if (!current) throw new UsersError('User not found', 'NOT_FOUND', 404);

    if (input.active === false && current.active === true) {
      const ownerCheck = await db.user.findFirst({
        where: { role: { isOwner: true }, active: true, id: { not: id } },
        select: { id: true },
      });
      if (!ownerCheck) {
        throw new UsersError(
          'Cannot deactivate the last active user with owner role',
          'LAST_OWNER',
          422,
        );
      }
    }

    // Atomic optimistic-concurrency: conditional update on the expected version.
    const { count } = await db.user.updateMany({
      where: { id, version: input.version },
      data: {
        name: input.name,
        roleId: input.roleId,
        active: input.active,
        version: { increment: 1 },
      },
    });
    if (count === 0) {
      throw new UsersError('Version conflict', 'VERSION_CONFLICT', 409);
    }
    // End all sessions immediately when a user is deactivated.
    if (input.active === false) {
      await refreshTokenStore.revokeAllForUser(id);
    }
    return db.user.findUniqueOrThrow({ where: { id }, select: userSelect });
  }

  async setPassword(id: string, password: string): Promise<void> {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw new UsersError('User not found', 'NOT_FOUND', 404);
    const passwordHash = await hashPassword(password);
    await db.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}

export class UsersError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'UsersError';
  }
}

export const usersService = new UsersService();
