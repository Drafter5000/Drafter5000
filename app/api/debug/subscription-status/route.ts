import { getServerSupabaseUser } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/debug/subscription-status
 * Debug endpoint to check the current subscription status in the database
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);

    // Get pending style data
    const { data: pendingStyle, error: pendingError } = await supabaseAdmin
      .from('pending_style_data')
      .select('*')
      .eq('user_id', user.id);

    // Get article styles
    const { data: articleStyles, error: stylesError } = await supabaseAdmin
      .from('article_styles')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({
      user_id: user.id,
      user_email: user.email,
      profile: {
        data: profile,
        error: profileError?.message,
      },
      subscriptions: {
        data: subscriptions,
        error: subError?.message,
      },
      pending_style: {
        data: pendingStyle,
        error: pendingError?.message,
      },
      article_styles: {
        data: articleStyles,
        error: stylesError?.message,
      },
      analysis: {
        subscription_status: profile?.subscription_status,
        subscription_status_type: typeof profile?.subscription_status,
        is_exactly_active: profile?.subscription_status === 'active',
        onboarding_completed: profile?.onboarding_completed,
        stripe_customer_id: profile?.stripe_customer_id,
      },
    });
  } catch (error: unknown) {
    console.error('Debug error:', error);
    const message = error instanceof Error ? error.message : 'Debug failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
