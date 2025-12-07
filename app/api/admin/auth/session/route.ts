import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { mapToUserRole, canAccessBackoffice } from '@/lib/role-config';

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated or not an admin' }, { status: 401 });
    }

    // Map to UserRoleType and check backoffice access
    const userRoleType = mapToUserRole(session.role, session.is_super_admin);

    if (!canAccessBackoffice(userRoleType)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        userRoleType,
      },
    });
  } catch (error) {
    console.error('Admin session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
