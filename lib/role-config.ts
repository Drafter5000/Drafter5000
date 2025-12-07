import type { OrgRole, RoleConfig, BackofficeScope } from './types';
import { UserRoleType } from './types';

/**
 * Role configurations mapping UserRoleType to database fields and UI properties
 */
export const ROLE_CONFIGS: Record<UserRoleType, RoleConfig> = {
  [UserRoleType.CUSTOMER]: {
    value: UserRoleType.CUSTOMER,
    label: 'Customer',
    description: 'End-user with access to their own data',
    dbOrgRole: 'member',
    isSuperAdmin: false,
    canAccessBackoffice: false,
    backofficeScope: 'none',
  },
  [UserRoleType.CUSTOMER_ADMIN]: {
    value: UserRoleType.CUSTOMER_ADMIN,
    label: 'Customer Admin',
    description: 'Organization administrator with access to org data',
    dbOrgRole: 'admin',
    isSuperAdmin: false,
    canAccessBackoffice: true,
    backofficeScope: 'organization',
  },
  [UserRoleType.SUPER_ADMIN]: {
    value: UserRoleType.SUPER_ADMIN,
    label: 'Super Admin',
    description: 'Platform administrator with full access',
    dbOrgRole: 'super_admin',
    isSuperAdmin: true,
    canAccessBackoffice: true,
    backofficeScope: 'platform',
  },
};

/**
 * Returns array of all role configurations for dropdown options
 */
export function getRoleOptions(): RoleConfig[] {
  return Object.values(ROLE_CONFIGS);
}

/**
 * Maps database fields (org_role, is_super_admin) to UserRoleType
 * Handles backward compatibility with existing data
 */
export function mapToUserRole(orgRole: OrgRole | null, isSuperAdmin: boolean): UserRoleType {
  // Super admin flag takes precedence
  if (isSuperAdmin) {
    return UserRoleType.SUPER_ADMIN;
  }

  // Map based on org_role
  switch (orgRole) {
    case 'super_admin':
      return UserRoleType.SUPER_ADMIN;
    case 'admin':
      return UserRoleType.CUSTOMER_ADMIN;
    case 'member':
    case 'viewer':
    default:
      return UserRoleType.CUSTOMER;
  }
}

/**
 * Maps UserRoleType to database fields
 */
export function mapToDbFields(role: UserRoleType): { orgRole: OrgRole; isSuperAdmin: boolean } {
  const config = ROLE_CONFIGS[role];
  if (!config) {
    throw new TypeError(`Invalid role: ${role}`);
  }
  return {
    orgRole: config.dbOrgRole,
    isSuperAdmin: config.isSuperAdmin,
  };
}

/**
 * Returns display label for a role
 */
export function getRoleLabel(role: UserRoleType): string {
  const config = ROLE_CONFIGS[role];
  if (!config) {
    return 'Unknown';
  }
  return config.label;
}

/**
 * Checks if a role can access the admin backoffice
 */
export function canAccessBackoffice(role: UserRoleType): boolean {
  const config = ROLE_CONFIGS[role];
  return config?.canAccessBackoffice ?? false;
}

/**
 * Returns the backoffice scope for a role
 */
export function getBackofficeScope(role: UserRoleType): BackofficeScope {
  const config = ROLE_CONFIGS[role];
  return config?.backofficeScope ?? 'none';
}

/**
 * Checks if a role has platform-wide access
 */
export function hasPlatformAccess(role: UserRoleType): boolean {
  return getBackofficeScope(role) === 'platform';
}

/**
 * Checks if a role has organization-level access
 */
export function hasOrganizationAccess(role: UserRoleType): boolean {
  const scope = getBackofficeScope(role);
  return scope === 'organization' || scope === 'platform';
}
