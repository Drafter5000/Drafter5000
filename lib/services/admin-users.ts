import { getSupabaseAdmin } from '../supabase-admin';
import { createAuditLog } from './audit-log';
import type {
  AdminUserView,
  CreateUserInput,
  ListParams,
  OrgRole,
  PaginatedResult,
} from '../types';

/**
 * Lists users with pagination and search
 */
export async function listUsers(
  params: ListParams = {},
  adminId?: string
): Promise<PaginatedResult<AdminUserView>> {
  const supabase = getSupabaseAdmin();
  const page = params.page || 1;
  const pageSize = params.page_size || 10;
  const offset = (page - 1) * pageSize;

  let query = supabase.from('user_profiles').select(
    `
      id,
      email,
      display_name,
      subscription_status,
      subscription_plan,
      is_super_admin,
      current_organization_id,
      created_at,
      updated_at
    `,
    { count: 'exact' }
  );

  // Apply search filter
  if (params.search) {
    query = query.or(`email.ilike.%${params.search}%,display_name.ilike.%${params.search}%`);
  }

  // Apply sorting
  const sortBy = params.sort_by || 'created_at';
  const sortOrder = params.sort_order === 'asc' ? true : false;
  query = query.order(sortBy, { ascending: sortOrder });

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Failed to list users:', error);
    return {
      data: [],
      total: 0,
      page,
      page_size: pageSize,
      total_pages: 0,
    };
  }

  // Enrich with organization info
  const enrichedUsers: AdminUserView[] = await Promise.all(
    (data || []).map(async user => {
      let orgName: string | null = null;
      let role: OrgRole | null = null;

      if (user.current_organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', user.current_organization_id)
          .single();
        orgName = org?.name || null;

        const { data: membership } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('organization_id', user.current_organization_id)
          .eq('is_active', true)
          .single();
        role = membership?.role || null;
      }

      return {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role,
        organization_id: user.current_organization_id,
        organization_name: orgName,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        is_active: true, // Users in user_profiles are active by default
        is_super_admin: user.is_super_admin,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    })
  );

  return {
    data: enrichedUsers,
    total: count || 0,
    page,
    page_size: pageSize,
    total_pages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Gets a single user by ID
 */
export async function getUserById(userId: string): Promise<AdminUserView | null> {
  const supabase = getSupabaseAdmin();

  const { data: user, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return null;
  }

  let orgName: string | null = null;
  let role: OrgRole | null = null;

  if (user.current_organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.current_organization_id)
      .single();
    orgName = org?.name || null;

    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', user.current_organization_id)
      .eq('is_active', true)
      .single();
    role = membership?.role || null;
  }

  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    role,
    organization_id: user.current_organization_id,
    organization_name: orgName,
    subscription_status: user.subscription_status,
    subscription_plan: user.subscription_plan,
    is_active: true,
    is_super_admin: user.is_super_admin,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

/**
 * Creates a new user
 */
export async function createUser(
  input: CreateUserInput,
  adminId: string
): Promise<{ user: AdminUserView | null; error: string | null }> {
  const supabase = getSupabaseAdmin();

  // Check if email already exists
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', input.email)
    .single();

  if (existing) {
    return { user: null, error: 'Email already exists' };
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { user: null, error: authError?.message || 'Failed to create auth user' };
  }

  // Create user profile
  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: authData.user.id,
    email: input.email,
    display_name: input.display_name,
    subscription_status: 'trial',
    subscription_plan: 'free',
    is_super_admin: input.role === 'super_admin',
    current_organization_id: input.organization_id || null,
  });

  if (profileError) {
    // Cleanup: delete auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { user: null, error: 'Failed to create user profile' };
  }

  // Add to organization if specified
  if (input.organization_id) {
    await supabase.from('organization_members').insert({
      organization_id: input.organization_id,
      user_id: authData.user.id,
      role: input.role,
      invited_by: adminId,
      invited_at: new Date().toISOString(),
      is_active: true,
    });
  }

  // Create audit log
  await createAuditLog({
    admin_id: adminId,
    action: 'user.create',
    target_type: 'user',
    target_id: authData.user.id,
    details: { email: input.email, role: input.role },
  });

  return { user: await getUserById(authData.user.id), error: null };
}

/**
 * Updates a user's role
 */
export async function updateUserRole(
  userId: string,
  role: OrgRole,
  organizationId: string,
  adminId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseAdmin();

  // Update or insert organization membership
  const { data: existing } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('organization_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) {
      return { success: false, error: 'Failed to update role' };
    }
  } else {
    const { error } = await supabase.from('organization_members').insert({
      organization_id: organizationId,
      user_id: userId,
      role,
      invited_by: adminId,
      is_active: true,
    });

    if (error) {
      return { success: false, error: 'Failed to assign role' };
    }
  }

  // Update super_admin flag if needed
  if (role === 'super_admin') {
    await supabase.from('user_profiles').update({ is_super_admin: true }).eq('id', userId);
  }

  // Create audit log
  await createAuditLog({
    admin_id: adminId,
    action: 'user.update_role',
    target_type: 'user',
    target_id: userId,
    details: { new_role: role, organization_id: organizationId },
  });

  return { success: true, error: null };
}

/**
 * Deactivates a user account
 */
export async function deactivateUser(
  userId: string,
  adminId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseAdmin();

  // Deactivate all organization memberships
  const { error: memberError } = await supabase
    .from('organization_members')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (memberError) {
    return { success: false, error: 'Failed to deactivate memberships' };
  }

  // Disable auth user
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: '876000h', // ~100 years
  });

  if (authError) {
    return { success: false, error: 'Failed to disable user authentication' };
  }

  // Create audit log
  await createAuditLog({
    admin_id: adminId,
    action: 'user.deactivate',
    target_type: 'user',
    target_id: userId,
  });

  return { success: true, error: null };
}

/**
 * Reactivates a user account
 */
export async function reactivateUser(
  userId: string,
  adminId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseAdmin();

  // Reactivate organization memberships
  const { error: memberError } = await supabase
    .from('organization_members')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (memberError) {
    return { success: false, error: 'Failed to reactivate memberships' };
  }

  // Unban auth user
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
  });

  if (authError) {
    return { success: false, error: 'Failed to enable user authentication' };
  }

  // Create audit log
  await createAuditLog({
    admin_id: adminId,
    action: 'user.reactivate',
    target_type: 'user',
    target_id: userId,
  });

  return { success: true, error: null };
}
