import { type NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient, getServerSupabaseSession } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/auth/complete-linkedin-onboarding
 *
 * Completes the onboarding process for LinkedIn OAuth users.
 * Updates user profile with job and stores pending style data.
 *
 * Flow:
 * 1. Verify user is authenticated via LinkedIn OAuth
 * 2. Update user profile with job field
 * 3. Store style data in pending_style_data table
 * 4. Redirect to subscribe page
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please sign in with LinkedIn first.',
          retry: false,
        },
        { status: 401 }
      );
    }

    const user = session.user;
    const body = await request.json();
    const { job, style_samples, subjects, preferred_language, delivery_days } = body;

    // Validate required fields
    if (!job || job.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job title is required',
          fields: { job: 'Job must be at least 2 characters' },
          retry: true,
        },
        { status: 400 }
      );
    }

    if (!style_samples || style_samples.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one style sample is required',
          retry: true,
        },
        { status: 400 }
      );
    }

    if (!subjects || subjects.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one topic is required',
          retry: true,
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const supabase = await getServerSupabaseClient();

    // Get current user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .eq('id', user.id)
      .single();

    // Update user profile with job field
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ job })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update profile. Please try again.',
          retry: true,
        },
        { status: 500 }
      );
    }

    // Store style data in pending_style_data table
    const displayName =
      profile?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';

    const { error: pendingStyleError } = await supabaseAdmin.from('pending_style_data').upsert(
      {
        user_id: user.id,
        display_name: displayName,
        style_samples: style_samples,
        subjects: subjects,
        preferred_language: preferred_language || 'en',
        delivery_days: delivery_days || [],
        job: job,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (pendingStyleError) {
      console.error('Failed to save pending style data:', pendingStyleError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save style data. Please try again.',
          retry: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user_id: user.id,
      redirect_url: '/subscribe',
      message: 'Profile completed successfully. Please select a plan to continue.',
    });
  } catch (error: unknown) {
    console.error('Complete LinkedIn onboarding error:', error);
    const message = error instanceof Error ? error.message : 'Failed to complete profile';
    return NextResponse.json(
      {
        success: false,
        error: message,
        retry: true,
      },
      { status: 500 }
    );
  }
}
