import { describe, it, expect, vi } from 'vitest';
import { usersService, UsersError } from '.';

vi.mock('@studioflow/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
  },
}));

const { db } = await import('@studioflow/db');

describe('UsersService', () => {
  describe('create', () => {
    it('throws EMAIL_TAKEN when email exists', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: 'existing' } as never);
      await expect(
        usersService.create({ name: 'Test', email: 't@t.com', password: 'password123', roleId: 'r1' }),
      ).rejects.toThrow(UsersError);
    });

    it('creates a user when email is unique', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(db.role.findUnique).mockResolvedValueOnce({ id: 'r1' } as never);
      vi.mocked(db.user.create).mockResolvedValueOnce({ id: 'new-id' } as never);
      const result = await usersService.create({ name: 'Test', email: 't@t.com', password: 'password123', roleId: 'r1' });
      expect(result).toBeDefined();
    });

    it('throws INVALID_ROLE when the role does not exist', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(db.role.findUnique).mockResolvedValueOnce(null);
      await expect(
        usersService.create({ name: 'Test', email: 't@t.com', password: 'password123', roleId: 'missing' }),
      ).rejects.toThrow('Role does not exist');
    });
  });

  describe('last-owner guard', () => {
    it('blocks deactivating the last owner user', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: 'u1', active: true, version: 1 } as never);
      vi.mocked(db.user.findFirst).mockResolvedValueOnce(null);
      await expect(
        usersService.update('u1', { active: false, version: 1 }),
      ).rejects.toThrow('last active user with owner role');
    });
  });
});
