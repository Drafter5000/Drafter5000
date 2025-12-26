import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, canPerformAdminAction } from '@/lib/admin-auth';
import {
  getOrganizationById,
  getOrganizationMembers,
  updateOrganization,
  deactivateOrganization,
  reactivateOrganization,
} from '@/lib/services/admin-organizations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    const organization = await getOrganizationById(orgId);

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get members
    const members = await getOrganizationMembers(orgId);

    return NextResponse.json({
      success: true,
      organization,
      members,
    });
  } catch (error) {
    console.error('Admin get organization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    const body = await request.json();
    const { name, slug, logo_url, settings, action } = body;

    // Check permission
    const canPerform = await canPerformAdminAction(session.user_id, 'org.update', orgId);
    if (!canPerform && !session.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle deactivate/reactivate actions
    if (action === 'deactivate') {
      const result = await deactivateOrganization(orgId, session.user_id);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Organization deactivated' });
    }

    if (action === 'reactivate') {
      const result = await reactivateOrganization(orgId, session.user_id);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Organization reactivated' });
    }

    // Handle settings update
    const result = await updateOrganization(
      orgId,
      { name, slug, logo_url, settings },
      session.user_id
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Organization updated',
    });
  } catch (error) {
    console.error('Admin update organization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    // Only super admins can delete organizations
    if (!session.is_super_admin) {
      return NextResponse.json(
        { error: 'Only super admins can delete organizations' },
        { status: 403 }
      );
    }

    const result = await deactivateOrganization(orgId, session.user_id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Organization deactivated',
    });
  } catch (error) {
    console.error('Admin delete organization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
