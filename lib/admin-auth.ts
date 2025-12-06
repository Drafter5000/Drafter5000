import { getServerSupabaseClient } from './supabase-client';
import { getSupabaseAdmin } from './supabase-admin';
import type { AdminSession, OrgRole, AdminAction } from './types';

export interface AdminAuthResult {
  success: boolean;
  user: AdminSession | null;
  error?: string;
}

/**
 * Validates if a user has admin privileges
 * Admin access is granted if:
 * 1. User has is_super_admin = true in user_profiles
 * 2. User has role 'super_admin' or 'admin' in any organization
 */
export async function validateAdminAccess(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // Check if user is super admin
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return false;
  }

  if (profile.is_super_admin) {
    return true;
  }

  // Check if user has admin role in any organization
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('role', ['super_admin', 'admin'])
    .limit(1);

  if (memberError) {
    return false;
  }

  return membership && membership.length > 0;
}

/**
 * Gets the admin session from the current request
 * Returns null if user is not authenticated or not an admin
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const adminSupabase = getSupabaseAdmin();

  // Get user profile with admin status
  const { data: profile, error: profileError } = await adminSupabase
    .from('user_profiles')
    .select('id, email, is_super_admin, current_organization_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  // Check admin access
  const isAdmin = await validateAdminAccess(user.id);
  if (!isAdmin) {
    return null;
  }

  // Get user's role in their current organization
  let role: OrgRole | null = null;
  if (profile.current_organization_id) {
    const { data: membership } = await adminSupabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', profile.current_organization_id)
      .eq('is_active', true)
      .single();

    role = membership?.role || null;
  }

  return {
    user_id: profile.id,
    email: profile.email,
    is_super_admin: Boolean(profile.is_super_admin),
    organization_id: profile.current_organization_id,
    role,
  };
}

/**
 * Checks if an admin can perform a specific action on a target
 * Super admins can perform any action
 * Org admins can only perform actions within their organization
 */
export async function canPerformAdminAction(
  adminId: string,
  action: AdminAction,
  targetId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // Check if admin is super admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', adminId)
    .single();

  if (profile?.is_super_admin === true) {
    return true;
  }

  // For org-level admins, check if target is in their organization
  const targetType = action.startsWith('user.') ? 'user' : 'organization';

  if (targetType === 'user') {
    // Get admin's organizations where they have admin role
    const { data: adminOrgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', adminId)
      .eq('is_active', true)
      .in('role', ['super_admin', 'admin']);

    if (!adminOrgs || adminOrgs.length === 0) {
      return false;
    }

    const orgIds = adminOrgs.map(o => o.organization_id);

    // Check if target user is in any of admin's organizations
    const { data: targetMembership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', targetId)
      .eq('is_active', true)
      .in('organization_id', orgIds)
      .limit(1);

    return !!(targetMembership && targetMembership.length > 0);
  }

  if (targetType === 'organization') {
    // Check if admin has admin role in the target organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', adminId)
      .eq('organization_id', targetId)
      .eq('is_active', true)
      .in('role', ['super_admin', 'admin'])
      .single();

    return !!membership;
  }

  return false;
}

/**
 * Requires super admin access for the current request.
 * Throws an error if the user is not a super admin.
 */
export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  if (!session.is_super_admin) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Requires admin access (super admin or org admin) for the current request.
 * Throws an error if the user is not an admin.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Authenticates admin login and returns session info
 */
export async function authenticateAdmin(email: string, password: string): Promise<AdminAuthResult> {
  const supabase = await getServerSupabaseClient();

  // Attempt to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      success: false,
      user: null,
      error: 'Invalid email or password',
    };
  }

  // Validate admin access
  const isAdmin = await validateAdminAccess(data.user.id);
  if (!isAdmin) {
    // Sign out the non-admin user
    await supabase.auth.signOut();
    return {
      success: false,
      user: null,
      error: 'Access denied. Admin privileges required.',
    };
  }

  // Get full admin session
  const session = await getAdminSession();
  if (!session) {
    return {
      success: false,
      user: null,
      error: 'Failed to create admin session',
    };
  }

  return {
    success: true,
    user: session,
  };
}
