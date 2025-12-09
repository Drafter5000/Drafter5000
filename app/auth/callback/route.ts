import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

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
      // If explicit next URL provided, use it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Check subscription status to determine redirect
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_status')
        .eq('id', data.user.id)
        .single();

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
