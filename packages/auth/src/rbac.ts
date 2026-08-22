import { Role, Permission } from '@novaqa/types';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    'org.read',
    'org.update',
    'org.delete',
    'team.manage',
    'project.read',
    'project.create',
    'project.update',
    'project.delete',
    'test.read',
    'test.create',
    'test.execute',
    'test.delete',
    'run.read',
    'run.execute',
    'run.cancel',
    'finding.read',
    'finding.update',
    'billing.read',
    'billing.manage',
    'api_key.read',
    'api_key.create',
    'api_key.delete',
    'mcp.connect',
    'ai.trigger'
  ],
  [Role.ADMIN]: [
    'org.read',
    'org.update',
    'team.manage',
    'project.read',
    'project.create',
    'project.update',
    'project.delete',
    'test.read',
    'test.create',
    'test.execute',
    'test.delete',
    'run.read',
    'run.execute',
    'run.cancel',
    'finding.read',
    'finding.update',
    'billing.read',
    'api_key.read',
    'api_key.create',
    'api_key.delete',
    'mcp.connect',
    'ai.trigger'
  ],
  [Role.QA_ENGINEER]: [
    'org.read',
    'project.read',
    'project.create',
    'project.update',
    'test.read',
    'test.create',
    'test.execute',
    'test.delete',
    'run.read',
    'run.execute',
    'run.cancel',
    'finding.read',
    'finding.update',
    'api_key.read',
    'api_key.create',
    'mcp.connect',
    'ai.trigger'
  ],
  [Role.DEVELOPER]: [
    'org.read',
    'project.read',
    'project.create',
    'project.update',
    'test.read',
    'test.create',
    'test.execute',
    'run.read',
    'run.execute',
    'finding.read',
    'api_key.read',
    'api_key.create',
    'mcp.connect',
    'ai.trigger'
  ],
  [Role.VIEWER]: [
    'org.read',
    'project.read',
    'test.read',
    'run.read',
    'finding.read'
  ],
  [Role.BILLING_MANAGER]: [
    'org.read',
    'billing.read',
    'billing.manage'
  ]
};

export class AccessControl {
  static hasPermission(role: Role, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  static getPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  static assertPermission(role: Role, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new Error(`Forbidden: Role '${role}' lacks permission '${permission}'`);
    }
  }
}

export function can(role: Role, permission: Permission): boolean {
  return AccessControl.hasPermission(role, permission);
}
