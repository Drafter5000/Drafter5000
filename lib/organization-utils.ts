import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { Organization, OrganizationMember, OrganizationWithRole, OrgRole } from '@/lib/types';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Get the default organization
 */
export async function getDefaultOrganization(): Promise<Organization | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', DEFAULT_ORG_ID)
    .single();

  if (error) {
    console.error('Error fetching default organization:', error);
    return null;
  }

  return data;
}

/**
 * Get all organizations a user belongs to
 */
export async function getUserOrganizations(userId: string): Promise<OrganizationWithRole[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('organization_members')
    .select(
      `
      role,
      organizations (*)
    `
    )
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    ...item.organizations,
    role: item.role as OrgRole,
  }));
}

/**
 * Get user's role in a specific organization
 */
export async function getUserOrgRole(
  userId: string,
  organizationId: string
): Promise<OrgRole | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (error) {
    return null;
  }

  return data?.role as OrgRole;
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single();

  if (error) {
    return false;
  }

  return data?.is_super_admin === true;
}

/**
 * Check if user has admin access to an organization
 */
export async function hasOrgAdminAccess(userId: string, organizationId: string): Promise<boolean> {
  // Super admins have access to everything
  if (await isSuperAdmin(userId)) {
    return true;
  }

  const role = await getUserOrgRole(userId, organizationId);
  return role === 'super_admin' || role === 'admin';
}

/**
 * Add user to organization
 */
export async function addUserToOrganization(
  userId: string,
  organizationId: string,
  role: OrgRole = 'member',
  invitedBy?: string
): Promise<OrganizationMember | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('organization_members')
    .upsert({
      user_id: userId,
      organization_id: organizationId,
      role,
      invited_by: invitedBy,
      invited_at: invitedBy ? new Date().toISOString() : null,
      joined_at: new Date().toISOString(),
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding user to organization:', error);
    return null;
  }

  return data;
}

/**
 * Set user as super admin and add to default org
 */
export async function setupSuperAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // Update user profile to be super admin
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      is_super_admin: true,
      current_organization_id: DEFAULT_ORG_ID,
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Error setting super admin:', profileError);
    return false;
  }

  // Add to default organization as super_admin
  const member = await addUserToOrganization(userId, DEFAULT_ORG_ID, 'super_admin');

  return member !== null;
}

/**
 * Setup new user with default organization
 */
export async function setupNewUserOrganization(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // Update user's current organization
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      current_organization_id: DEFAULT_ORG_ID,
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating user organization:', profileError);
    return false;
  }

  // Add to default organization as member
  const member = await addUserToOrganization(userId, DEFAULT_ORG_ID, 'member');

  return member !== null;
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(
  organizationId: string
): Promise<(OrganizationMember & { user: { email: string; display_name: string } })[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('organization_members')
    .select(
      `
      *,
      user:user_profiles (email, display_name)
    `
    )
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('role', { ascending: true });

  if (error) {
    console.error('Error fetching organization members:', error);
    return [];
  }

  return data || [];
}
