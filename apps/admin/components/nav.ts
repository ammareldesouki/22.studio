import { PERMISSIONS } from '@studioflow/types';

export interface NavItem {
  href: string;
  label: string;
  // Any of these permissions grants access; undefined = every signed-in user.
  perms?: string[];
}

export interface NavGroup { title: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    title: 'Content',
    items: [
      { href: '/', label: 'Dashboard' },
      { href: '/projects', label: 'Projects', perms: [PERMISSIONS.PROJECTS_EDIT, PERMISSIONS.PROJECTS_CREATE] },
      { href: '/media', label: 'Media', perms: [PERMISSIONS.MEDIA_UPLOAD] },
      { href: '/clients', label: 'Clients', perms: [PERMISSIONS.CLIENTS_MANAGE] },
      { href: '/services', label: 'Services', perms: [PERMISSIONS.SERVICES_MANAGE] },
      { href: '/homepage', label: 'Homepage', perms: [PERMISSIONS.HOMEPAGE_MANAGE] },
      { href: '/messages', label: 'Messages' },
      { href: '/budgets', label: 'Budgets', perms: [PERMISSIONS.SETTINGS_MANAGE] },
      { href: '/reviews', label: 'Reviews', perms: [PERMISSIONS.SETTINGS_MANAGE] },
    ],
  },
  {
    title: 'Studio',
    items: [
      { href: '/settings', label: 'Settings', perms: [PERMISSIONS.SETTINGS_MANAGE] },
      { href: '/users', label: 'Team', perms: [PERMISSIONS.USERS_MANAGE] },
      { href: '/roles', label: 'Roles', perms: [PERMISSIONS.ROLES_MANAGE] },
    ],
  },
];
