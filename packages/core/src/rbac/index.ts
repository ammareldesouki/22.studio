import { Permission, ALL_PERMISSIONS } from '@studioflow/types';

// ── Permission check (FR-006, FR-007, deny-by-default) ───────────────────

export interface Principal {
  id: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
    isOwner: boolean;
  };
}

/**
 * Deny-by-default permission check (SC-003).
 * - Owner role → always allowed (short-circuit).
 * - Non-owner → allowed only if the required permission is in the role's set.
 * - Any missing permission → denied.
 * - Invalid permission string → denied (not in catalog).
 */
export function requirePermission(
  principal: Principal,
  required: Permission,
): void {
  if (principal.role.isOwner) return;

  if (!ALL_PERMISSIONS.includes(required)) {
    throw new RbacError(`Invalid permission: ${required}`, 'INVALID_PERMISSION');
  }

  if (!principal.role.permissions.includes(required)) {
    throw new RbacError(
      `Missing required permission: ${required}`,
      'FORBIDDEN',
    );
  }
}

export class RbacError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RbacError';
  }
}
