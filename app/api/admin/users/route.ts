import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { listUsers, createUser } from '@/lib/services/admin-users';
import type { ScopedListParams } from '@/lib/services/admin-users';
import { UserRoleType } from '@/lib/types';
import { mapToDbFields, mapToUserRole, canAccessBackoffice } from '@/lib/role-config';
import { createOrgScopeContext, validateAdminAccess } from '@/lib/services/org-scope';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create scope context and validate admin access
    const scopeContext = await createOrgScopeContext(session);

    // Check if user can access backoffice
    if (!canAccessBackoffice(scopeContext.userRoleType)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params: ScopedListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      page_size: parseInt(searchParams.get('page_size') || '10'),
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || undefined,
      // Super Admins can filter by organization
      organization_id: searchParams.get('organization_id') || undefined,
    };

    const result = await listUsers(params, scopeContext);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create scope context and validate admin access
    const scopeContext = await createOrgScopeContext(session);

    if (!canAccessBackoffice(scopeContext.userRoleType)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { email, display_name, password, userRoleType, organization_id } = body;

    if (!email || !display_name || !password || !userRoleType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate userRoleType is a valid enum value
    if (!Object.values(UserRoleType).includes(userRoleType)) {
      return NextResponse.json({ error: 'Invalid role type' }, { status: 400 });
    }

    // Customer Admins can only create users in their own organization
    let targetOrgId = organization_id;
    if (!scopeContext.isSuperAdmin) {
      // Force organization to be the admin's current organization
      targetOrgId = scopeContext.currentOrgId;

      // Customer Admins cannot create Super Admins
      if (userRoleType === UserRoleType.SUPER_ADMIN) {
        return NextResponse.json({ error: 'Cannot create Super Admin users' }, { status: 403 });
      }
    }

    // Map UserRoleType to database fields
    const { orgRole, isSuperAdmin } = mapToDbFields(userRoleType as UserRoleType);

    const result = await createUser(
      {
        email,
        display_name,
        password,
        role: orgRole,
        organization_id: targetOrgId,
        is_super_admin: isSuperAdmin,
      },
      session.user_id
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error('Admin user create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
