import { type NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient, getServerSupabaseSession } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

interface ProfileUpdateInput {
  job?: string;
  display_name?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getServerSupabaseClient();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Handle case where profile doesn't exist - auto-create it
    if (error && error.code === 'PGRST116') {
      // Profile not found - create one for this authenticated user
      const supabaseAdmin = getSupabaseAdmin();

      const newProfile = {
        id: session.user.id,
        email: session.user.email || '',
        display_name:
          session.user.user_metadata?.display_name ||
          session.user.user_metadata?.full_name ||
          session.user.email?.split('@')[0] ||
          'User',
        subscription_status: 'incomplete',
        subscription_plan: 'free',
        current_organization_id: DEFAULT_ORG_ID,
        is_super_admin: false,
      };

      const { data: createdProfile, error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      return NextResponse.json(createdProfile);
    }

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (error: unknown) {
    console.error('Profile error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ProfileUpdateInput;
    const supabase = await getServerSupabaseClient();

    // Build update object with only allowed fields
    const updateData: Record<string, unknown> = {};
    if (body.job !== undefined) updateData.job = body.job;
    if (body.display_name !== undefined) updateData.display_name = body.display_name;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (error: unknown) {
    console.error('Profile update error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
