import { Role } from './enums/roles.enum';

/** Feature flags per role (extend as needed). */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.ADMIN]: [
    'users:read',
    'users:write',
    'students:read',
    'students:write',
    'reports:read',
    'reports:write',
    'data_sources:read',
    'data_sources:write',
    'audit:read',
    'settings:write',
  ],
  [Role.COORDINATOR]: [
    'students:read',
    'students:write',
    'reports:read',
    'reports:write',
    'data_sources:read',
    'data_sources:write',
  ],
  [Role.MENTOR]: ['students:read', 'reports:read', 'reports:write'],
  [Role.STUDENT]: ['portal:attendance', 'portal:read_score'],
};

export function roleHasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
