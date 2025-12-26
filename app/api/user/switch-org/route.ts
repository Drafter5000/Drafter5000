import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    const supabaseAdmin = getSupabaseAdmin();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organization_id } = body;

    if (!organization_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user is a member of the target organization
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .eq('is_active', true)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      );
    }

    // Update user's current organization
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        current_organization_id: organization_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update current organization:', updateError);
      return NextResponse.json({ error: 'Failed to switch organization' }, { status: 500 });
    }

    // Get the organization details
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug')
      .eq('id', organization_id)
      .single();

    return NextResponse.json({
      success: true,
      organization: org,
      role: membership.role,
    });
  } catch (error) {
    console.error('Switch organization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
