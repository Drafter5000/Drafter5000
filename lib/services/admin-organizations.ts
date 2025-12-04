import { getSupabaseAdmin } from '../supabase-admin';
import { createAuditLog } from './audit-log';
import type {
  AdminOrgView,
  CreateOrgInput,
  UpdateOrgInput,
  ListParams,
  PaginatedResult,
  OrgRole,
} from '../types';

/**
 * Lists organizations with pagination
 */
export async function listOrganizations(
  params: ListParams = {}
): Promise<PaginatedResult<AdminOrgView>> {
  const supabase = getSupabaseAdmin();
  const page = params.page || 1;
  const pageSize = params.page_size || 10;
  const offset = (page - 1) * pageSize;

  let query = supabase.from('organizations').select('*', { count: 'exact' });

  // Apply search filter
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%`);
  }

  // Apply sorting
  const sortBy = params.sort_by || 'created_at';
  const sortOrder = params.sort_order === 'asc' ? true : false;
  query = query.order(sortBy, { ascending: sortOrder });

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Failed to list organizations:', error);
    return {
      data: [],
      total: 0,
      page,
      page_size: pageSize,
      total_pages: 0,
    };
  }

  // Enrich with member counts
  const enrichedOrgs: AdminOrgView[] = await Promise.all(
    (data || []).map(async org => {
      const { count: memberCount } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('is_active', true);

      const { count: adminCount } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .in('role', ['super_admin', 'admin']);

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo_url: org.logo_url,
        member_count: memberCount || 0,
        admin_count: adminCount || 0,
        is_active: org.is_active,
        created_at: org.created_at,
        updated_at: org.updated_at,
      };
    })
  );

  return {
    data: enrichedOrgs,
    total: count || 0,
    page,
    page_size: pageSize,
    total_pages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Gets a single organization by ID with members
 */
export async function getOrganizationById(orgId: string): Promise<AdminOrgView | null> {
  const supabase = getSupabaseAdmin();

  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error || !org) {
    return null;
  }

  const { count: memberCount } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('is_active', true);

  const { count: adminCount } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('is_active', true)
    .in('role', ['super_admin', 'admin']);

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo_url: org.logo_url,
    member_count: memberCount || 0,
    admin_count: adminCount || 0,
    is_active: org.is_active,
    created_at: org.created_at,
    updated_at: org.updated_at,
  };
}

/**
 * Gets organization members
 */
export async function getOrganizationMembers(orgId: string): Promise<
  Array<{
    id: string;
    user_id: string;
    email: string;
    display_name: string | null;
    role: OrgRole;
    joined_at: string;
  }>
> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('organization_members')
    .select(
      `
      id,
      user_id,
      role,
      joined_at,
      user_profiles!inner (
        email,
        display_name
      )
    `
    )
    .eq('organization_id', orgId)
    .eq('is_active', true);

  if (error || !data) {
    return [];
  }

  return data.map((member: any) => ({
    id: member.id,
    user_id: member.user_id,
    email: member.user_profiles.email,
    display_name: member.user_profiles.display_name,
    role: member.role,
    joined_at: member.joined_at,
  }));
}

/**
 * Creates a new organization
 */
export async function createOrganization(
  input: CreateOrgInput,
  adminId: string
): Promise<{ organization: AdminOrgView | null; error: string | null }> {
  const supabase = getSupabaseAdmin();

  // Check if slug already exists
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', input.slug)
    .single();

  if (existing) {
    return { organization: null, error: 'Organization slug already exists' };
  }

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: input.name,
      slug: input.slug,
      logo_url: input.logo_url || null,
      settings: input.settings || {},
      is_active: true,
    })
    .select()
    .single();

  if (orgError || !org) {
    return { organization: null, error: 'Failed to create organization' };
  }

  // Add initial admin if specified
  if (input.initial_admin_id) {
    await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: input.initial_admin_id,
      role: 'admin',
      invited_by: adminId,
      is_active: true,
    });

    // Update user's current organization
    await supabase
      .from('user_profiles')
      .update({ current_organization_id: org.id })
      .eq('id', input.initial_admin_id);
  }

  // Create audit log
  await createAuditLog({
    admin_id: adminId,
    action: 'org.create',
    target_type: 'organization',
    target_id: org.id,
    details: { name: input.name, slug: input.slug },
  });

  return { organization: await getOrganizationById(org.id), error: null };
}

/**
 * Updates an organization
 */
export async function updateOrganization(
  orgId: string,
  input: UpdateOrgInput,
  adminId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseAdmin();

  // Check slug uniqueness if being updated
  if (input.slug) {
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', input.slug)
      .neq('id', orgId)
      .single();

    if (existing) {
      return { success: false, error: 'Organization slug already exists' };
    }
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.logo_url !== undefined) updateData.logo_url = input.logo_url;
  if (input.settings !== undefined) updateData.settings = input.settings;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { error } = await supabase.from('organizations').update(updateData).eq('id', orgId);

  if (error) {
    return { success: false, error: 'Failed to update organization' };
  }

  // Create audit log
  await createAuditLog({
    admin_id: adminId,
    action: 'org.update',
    target_type: 'organization',
    target_id: orgId,
    details: input as Record<string, unknown>,
  });

  return { success: true, error: null };
}

/**
 * Deactivates an organization
 */
export async function deactivateOrganization(
  orgId: string,
  adminId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseAdmin();

  // Deactivate organization
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', orgId);

  if (orgError) {
    return { success: false, error: 'Failed to deactivate organization' };
  }

  // Deactivate all memberships
  const { error: memberError } = await supabase
    .from('organization_members')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId);

  if (memberError) {
    return { success: false, error: 'Failed to deactivate memberships' };
  }

  // Create audit log
  await createAuditLog({
    admin_id: adminId,
    action: 'org.deactivate',
    target_type: 'organization',
    target_id: orgId,
  });

  return { success: true, error: null };
}

/**
 * Reactivates an organization
 */
export async function reactivateOrganization(
  orgId: string,
  adminId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('organizations')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', orgId);

  if (error) {
    return { success: false, error: 'Failed to reactivate organization' };
  }

  // Create audit log
  await createAuditLog({
    admin_id: adminId,
    action: 'org.reactivate',
    target_type: 'organization',
    target_id: orgId,
  });

  return { success: true, error: null };
}
