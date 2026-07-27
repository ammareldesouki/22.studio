import { describe, it, expect } from 'vitest';
import { PERMISSIONS } from '@studioflow/types';
import { requirePermission, RbacError, type Principal } from '@studioflow/core/rbac';

const owner: Principal = {
  id: 'owner',
  role: { id: 'r1', name: 'Owner', permissions: [], isOwner: true },
};

const editor: Principal = {
  id: 'editor',
  role: { id: 'r2', name: 'Editor', permissions: [PERMISSIONS.PROJECTS_EDIT], isOwner: false },
};

const mediaOnly: Principal = {
  id: 'media',
  role: { id: 'r3', name: 'Media Manager', permissions: [PERMISSIONS.MEDIA_UPLOAD, PERMISSIONS.MEDIA_DELETE], isOwner: false },
};

describe('RBAC policy tests (SC-003)', () => {
  describe('Owner — always allowed', () => {
    const perms = Object.values(PERMISSIONS);
    for (const perm of perms) {
      it(`owner can ${perm}`, () => {
        expect(() => requirePermission(owner, perm)).not.toThrow();
      });
    }
  });

  describe('Editor — only projects:edit allowed', () => {
    it('projects:edit allowed', () => {
      expect(() => requirePermission(editor, PERMISSIONS.PROJECTS_EDIT)).not.toThrow();
    });

    it('projects:create denied', () => {
      expect(() => requirePermission(editor, PERMISSIONS.PROJECTS_CREATE)).toThrow(RbacError);
    });

    it('projects:publish denied', () => {
      expect(() => requirePermission(editor, PERMISSIONS.PROJECTS_PUBLISH)).toThrow(RbacError);
    });

    it('projects:delete denied', () => {
      expect(() => requirePermission(editor, PERMISSIONS.PROJECTS_DELETE)).toThrow(RbacError);
    });

    it('media:upload denied', () => {
      expect(() => requirePermission(editor, PERMISSIONS.MEDIA_UPLOAD)).toThrow(RbacError);
    });

    it('roles:manage denied', () => {
      expect(() => requirePermission(editor, PERMISSIONS.ROLES_MANAGE)).toThrow(RbacError);
    });
  });

  describe('Media Manager — only media:upload and media:delete allowed', () => {
    it('media:upload allowed', () => {
      expect(() => requirePermission(mediaOnly, PERMISSIONS.MEDIA_UPLOAD)).not.toThrow();
    });

    it('media:delete allowed', () => {
      expect(() => requirePermission(mediaOnly, PERMISSIONS.MEDIA_DELETE)).not.toThrow();
    });

    it('projects:edit denied', () => {
      expect(() => requirePermission(mediaOnly, PERMISSIONS.PROJECTS_EDIT)).toThrow(RbacError);
    });
  });

  describe('Deny-by-default', () => {
    it('empty permissions role gets denied', () => {
      const empty: Principal = { id: 'empty', role: { id: 'r4', name: 'Empty', permissions: [], isOwner: false } };
      for (const perm of Object.values(PERMISSIONS)) {
        expect(() => requirePermission(empty, perm)).toThrow(RbacError);
      }
    });
  });
});
