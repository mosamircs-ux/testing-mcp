import { Role } from '@novaqa/types';

export type Permission =
  | 'org:read'
  | 'org:update'
  | 'org:delete'
  | 'team:manage'
  | 'project:read'
  | 'project:create'
  | 'project:update'
  | 'project:delete'
  | 'suite:manage'
  | 'test_run:create'
  | 'test_run:cancel'
  | 'finding:read'
  | 'finding:resolve'
  | 'api_key:manage'
  | 'mcp:connect'
  | 'ai:trigger';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    'org:read',
    'org:update',
    'org:delete',
    'team:manage',
    'project:read',
    'project:create',
    'project:update',
    'project:delete',
    'suite:manage',
    'test_run:create',
    'test_run:cancel',
    'finding:read',
    'finding:resolve',
    'api_key:manage',
    'mcp:connect',
    'ai:trigger'
  ],
  [Role.ADMIN]: [
    'org:read',
    'org:update',
    'team:manage',
    'project:read',
    'project:create',
    'project:update',
    'project:delete',
    'suite:manage',
    'test_run:create',
    'test_run:cancel',
    'finding:read',
    'finding:resolve',
    'api_key:manage',
    'mcp:connect',
    'ai:trigger'
  ],
  [Role.ENGINEER]: [
    'org:read',
    'project:read',
    'project:create',
    'project:update',
    'suite:manage',
    'test_run:create',
    'test_run:cancel',
    'finding:read',
    'finding:resolve',
    'mcp:connect',
    'ai:trigger'
  ],
  [Role.VIEWER]: [
    'org:read',
    'project:read',
    'finding:read'
  ]
};

export class AccessControl {
  static hasPermission(role: Role, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  static assertPermission(role: Role, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new Error(`Forbidden: Role '${role}' lacks permission '${permission}'`);
    }
  }
}
