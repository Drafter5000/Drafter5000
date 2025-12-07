import { getSupabaseAdmin } from '../supabase-admin';
import type { AdminSession } from '../types';
import { UserRoleType } from '../types';
import { mapToUserRole, hasPlatformAccess } from '../role-config';

/**
 * Organization scope context for filtering queries
 */
export interface OrgScopeContext {
  userId: string;
  currentOrgId: string | null;
  userRoleType: UserRoleType;
  isSuperAdmin: boolean;
}

/**
 * Creates an organization scope context from an admin session
 */
export async function createOrgScopeContext(session: AdminSession): Promise<OrgScopeContext> {
  const userRoleType = mapToUserRole(session.role, session.is_super_admin);

  return {
    userId: session.user_id,
    currentOrgId: session.organization_id,
    userRoleType,
    isSuperAdmin: session.is_super_admin,
  };
}

/**
 * Checks if the user can access a specific organization's data
 */
export function canAccessOrg(context: OrgScopeContext, targetOrgId: string): boolean {
  // Super admins can access any organization
  if (context.isSuperAdmin || hasPlatformAccess(context.userRoleType)) {
    return true;
  }

  // Customer admins can only access their own organization
  if (context.userRoleType === UserRoleType.CUSTOMER_ADMIN) {
    return context.currentOrgId === targetOrgId;
  }

  // Customers cannot access admin data
  return false;
}

/**
 * Gets the list of organization IDs the user can access
 * For Super Admins: returns all active organization IDs
 * For Customer Admins: returns only their current organization ID
 * For Customers: returns empty array (no admin access)
 */
export async function getAccessibleOrgIds(context: OrgScopeContext): Promise<string[]> {
  const supabase = getSupabaseAdmin();

  // Super admins can access all organizations
  if (context.isSuperAdmin || hasPlatformAccess(context.userRoleType)) {
    const { data: orgs } = await supabase.from('organizations').select('id').eq('is_active', true);

    return (orgs || []).map(org => org.id);
  }

  // Customer admins can only access their organization
  if (context.userRoleType === UserRoleType.CUSTOMER_ADMIN && context.currentOrgId) {
    return [context.currentOrgId];
  }

  // Customers have no admin access
  return [];
}

/**
 * Gets the organization filter for queries based on user's scope
 * Returns null for Super Admins (no filter needed)
 * Returns the org ID for Customer Admins
 */
export function getOrgFilter(context: OrgScopeContext): string | null {
  // Super admins see all - no filter
  if (context.isSuperAdmin || hasPlatformAccess(context.userRoleType)) {
    return null;
  }

  // Customer admins are scoped to their organization
  return context.currentOrgId;
}

/**
 * Checks if the user has platform-wide access (Super Admin)
 */
export function hasPlatformScope(context: OrgScopeContext): boolean {
  return context.isSuperAdmin || hasPlatformAccess(context.userRoleType);
}

/**
 * Checks if the user has organization-level access (Customer Admin or Super Admin)
 */
export function hasOrganizationScope(context: OrgScopeContext): boolean {
  return (
    context.userRoleType === UserRoleType.CUSTOMER_ADMIN ||
    context.userRoleType === UserRoleType.SUPER_ADMIN
  );
}

/**
 * Validates that the user can perform admin operations
 * Throws an error if the user doesn't have admin access
 */
export function validateAdminAccess(context: OrgScopeContext): void {
  if (context.userRoleType === UserRoleType.CUSTOMER) {
    throw new Error('Access denied: Admin privileges required');
  }
}

/**
 * Validates that the user can access a specific organization
 * Throws an error if access is denied
 */
export function validateOrgAccess(context: OrgScopeContext, targetOrgId: string): void {
  if (!canAccessOrg(context, targetOrgId)) {
    throw new Error('Access denied: Cannot access this organization');
  }
}
