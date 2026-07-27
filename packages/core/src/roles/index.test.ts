import { describe, it, expect, vi } from 'vitest';
import { rolesService, RolesError } from '.';

vi.mock('@studioflow/db', () => ({
  db: {
    role: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
  },
}));

const { db } = await import('@studioflow/db');

describe('RolesService', () => {
  describe('create', () => {
    it('creates a role with valid permissions', async () => {
      vi.mocked(db.role.findUnique).mockResolvedValueOnce(null);
      vi.mocked(db.role.create).mockResolvedValueOnce({ id: 'r1' } as never);
      const result = await rolesService.create({ name: 'Editor', permissions: ['projects:edit'] });
      expect(result).toBeDefined();
    });

    it('rejects invalid permissions', async () => {
      await expect(
        rolesService.create({ name: 'Bad', permissions: ['invalid:perm'] }),
      ).rejects.toThrow(RolesError);
    });
  });

  describe('delete', () => {
    it('blocks deleting the owner role', async () => {
      vi.mocked(db.role.findUnique).mockResolvedValueOnce({ id: 'r1', isOwner: true } as never);
      await expect(rolesService.delete('r1')).rejects.toThrow('immutable owner role');
    });

    it('blocks deleting a role with assigned users', async () => {
      vi.mocked(db.role.findUnique).mockResolvedValueOnce({ id: 'r2', isOwner: false } as never);
      vi.mocked(db.user.count).mockResolvedValueOnce(2);
      await expect(rolesService.delete('r2')).rejects.toThrow('assigned users');
    });
  });
});
