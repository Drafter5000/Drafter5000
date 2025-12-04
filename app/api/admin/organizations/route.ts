import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { listOrganizations, createOrganization } from '@/lib/services/admin-organizations';
import type { ListParams } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params: ListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      page_size: parseInt(searchParams.get('page_size') || '10'),
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || undefined,
    };

    const result = await listOrganizations(params);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Admin organizations list error:', error);
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

    // Only super admins can create organizations
    if (!session.is_super_admin) {
      return NextResponse.json(
        { error: 'Only super admins can create organizations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug, logo_url, settings, initial_admin_id } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const result = await createOrganization(
      { name, slug, logo_url, settings, initial_admin_id },
      session.user_id
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      organization: result.organization,
    });
  } catch (error) {
    console.error('Admin organization create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
