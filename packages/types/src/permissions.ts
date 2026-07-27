/**
 * Fixed permission catalog for the CMS (FR-006, research §3).
 *
 * Each entry is a `module:action` string. Roles store a subset of these.
 * The catalog is the single source of truth — always use `PERMISSIONS` constants
 * instead of string literals so renaming / auditing stays reliable.
 */
export const PERMISSIONS = {
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_EDIT: 'projects:edit',
  PROJECTS_PUBLISH: 'projects:publish',
  PROJECTS_DELETE: 'projects:delete',
  MEDIA_UPLOAD: 'media:upload',
  MEDIA_DELETE: 'media:delete',
  CLIENTS_MANAGE: 'clients:manage',
  SERVICES_MANAGE: 'services:manage',
  HOMEPAGE_MANAGE: 'homepage:manage',
  USERS_MANAGE: 'users:manage',
  ROLES_MANAGE: 'roles:manage',
  SETTINGS_MANAGE: 'settings:manage',
} as const;

/** Union type of every valid permission string. */
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Ordered array of all permissions (useful for rendering a role editor). */
export const ALL_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS);
