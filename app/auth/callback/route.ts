import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const type = searchParams.get('type');

  // Handle password reset flow - redirect to reset-password page
  if (type === 'recovery' || next === '/reset-password') {
    console.log('[Auth Callback] Password reset flow detected', { code: !!code, type, next });

    if (code) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            },
          },
        }
      );

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      console.log('[Auth Callback] Exchange result:', {
        success: !error,
        hasSession: !!data?.session,
        error: error?.message,
      });

      if (!error && data?.session) {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // If code exchange failed, log the error and redirect with details
      console.error('[Auth Callback] Code exchange failed:', error?.message);
    }
    return NextResponse.redirect(`${origin}/forgot-password?error=invalid_reset_link`);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;
      const isOAuthUser = user.app_metadata?.provider === 'linkedin_oidc';

      // If explicit next URL provided, use it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Check if user profile exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_status, job, onboarding_completed')
        .eq('id', user.id)
        .single();

      // For OAuth users without a profile, create one with LinkedIn data
      if (!profile && isOAuthUser) {
        const supabaseAdmin = getSupabaseAdmin();

        // Extract LinkedIn data from user metadata
        const linkedInName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.display_name ||
          user.email?.split('@')[0] ||
          'User';
        const linkedInEmail = user.email || '';
        // LinkedIn provides job title in user_metadata (headline or position)
        const linkedInJob =
          user.user_metadata?.headline ||
          user.user_metadata?.position ||
          user.user_metadata?.job_title ||
          '';

        // Create user profile
        await supabaseAdmin.from('user_profiles').insert({
          id: user.id,
          email: linkedInEmail,
          display_name: linkedInName,
          job: linkedInJob,
          subscription_status: 'incomplete',
          subscription_plan: 'free',
          current_organization_id: DEFAULT_ORG_ID,
          is_super_admin: false,
          onboarding_completed: false,
        });

        // Redirect to onboarding step-1 for new OAuth users
        return NextResponse.redirect(`${origin}/articles/generate/step-1?provider=linkedin`);
      }

      // For existing users, check if they need to complete onboarding
      if (profile && isOAuthUser && !profile.onboarding_completed) {
        // Check if user has pending style data or article styles
        const { data: pendingStyle } = await supabase
          .from('pending_style_data')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const { data: articleStyle } = await supabase
          .from('article_styles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        // If no style data exists, redirect to onboarding
        if (!pendingStyle && !articleStyle) {
          return NextResponse.redirect(`${origin}/articles/generate/step-1?provider=linkedin`);
        }
      }

      // Redirect based on subscription status
      const hasActiveSubscription = profile?.subscription_status === 'active';

      if (hasActiveSubscription) {
        return NextResponse.redirect(`${origin}/dashboard`);
      } else {
        // User needs to subscribe - redirect to subscribe page
        return NextResponse.redirect(`${origin}/subscribe`);
      }
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
