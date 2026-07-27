import { describe, it, expect } from 'vitest';
import { requirePermission, RbacError, type Principal } from '.';
import { PERMISSIONS } from '@studioflow/types';

const owner: Principal = {
  id: 'owner-id',
  role: { id: 'r1', name: 'Owner', permissions: [], isOwner: true },
};

const editor: Principal = {
  id: 'editor-id',
  role: { id: 'r2', name: 'Editor', permissions: [PERMISSIONS.PROJECTS_EDIT], isOwner: false },
};

describe('rbac', () => {
  describe('requirePermission', () => {
    it('allows owner any permission', () => {
      expect(() => requirePermission(owner, PERMISSIONS.PROJECTS_CREATE)).not.toThrow();
      expect(() => requirePermission(owner, PERMISSIONS.ROLES_MANAGE)).not.toThrow();
    });

    it('allows a role with the required permission', () => {
      expect(() => requirePermission(editor, PERMISSIONS.PROJECTS_EDIT)).not.toThrow();
    });

    it('denies a role without the required permission (deny-by-default)', () => {
      expect(() => requirePermission(editor, PERMISSIONS.PROJECTS_DELETE)).toThrow(RbacError);
    });

    it('throws for invalid permission strings on non-owner', () => {
      const invalid = 'invalid:thing' as never;
      expect(() => requirePermission(editor, invalid)).toThrow(RbacError);
    });
  });
});
