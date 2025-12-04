import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { listUsers, createUser } from '@/lib/services/admin-users';
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

    const result = await listUsers(params, session.user_id);

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

    const body = await request.json();
    const { email, display_name, password, role, organization_id } = body;

    if (!email || !display_name || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createUser(
      { email, display_name, password, role, organization_id },
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
