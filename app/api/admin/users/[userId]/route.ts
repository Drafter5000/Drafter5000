import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, canPerformAdminAction } from '@/lib/admin-auth';
import {
  getUserById,
  updateUserRole,
  deactivateUser,
  reactivateUser,
} from '@/lib/services/admin-users';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { role, organization_id, action } = body;

    // Check permission
    const canPerform = await canPerformAdminAction(session.user_id, 'user.update_role', userId);
    if (!canPerform && !session.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle deactivate/reactivate actions
    if (action === 'deactivate') {
      const result = await deactivateUser(userId, session.user_id);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'User deactivated' });
    }

    if (action === 'reactivate') {
      const result = await reactivateUser(userId, session.user_id);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'User reactivated' });
    }

    // Handle role update
    if (role && organization_id) {
      const result = await updateUserRole(userId, role, organization_id, session.user_id);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Role updated' });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Check permission
    const canPerform = await canPerformAdminAction(session.user_id, 'user.deactivate', userId);
    if (!canPerform && !session.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await deactivateUser(userId, session.user_id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'User deactivated',
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
