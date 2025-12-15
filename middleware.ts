import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/auth/callback',
  '/admin/login',
  '/forgot-password',
  '/reset-password',
];

// Routes accessible without authentication (anonymous onboarding flow)
const anonymousRoutes = ['/articles/generate'];

// Routes that require active subscription
const subscriptionRequiredRoutes = ['/dashboard', '/articles'];

// Onboarding step routes - logged-in users with existing styles cannot start new onboarding
const onboardingStepRoutes = [
  '/articles/generate/step-1',
  '/articles/generate/step-2',
  '/articles/generate/step-3',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  // Skip middleware for API routes - they handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow access to dashboard with payment_success parameter (just completed payment)
  // The payment verification flow redirects here after updating subscription status
  const isPaymentSuccessRedirect =
    pathname === '/dashboard' && searchParams.get('payment_success') === 'true';
  if (isPaymentSuccessRedirect) {
    // Still need to verify user is authenticated
    const supabaseResponse = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return supabaseResponse;
    }
  }

  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow public routes for everyone
  if (publicRoutes.includes(pathname)) {
    // Redirect authenticated users away from login/signup
    if (user && (pathname === '/login' || pathname === '/signup')) {
      // Check subscription status to determine where to redirect
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single();

      // Active or trialing subscription grants access (treat trialing as active since no free trial)
      const hasActiveSubscription =
        profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing';

      if (hasActiveSubscription) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/subscribe', request.url));
      }
    }
    return supabaseResponse;
  }

  // Allow anonymous routes (onboarding flow) for everyone
  const isAnonymousRoute = anonymousRoutes.some(route => pathname.startsWith(route));
  if (isAnonymousRoute) {
    // Check if logged-in user is trying to access onboarding steps
    // Logged-in users with existing article styles can only UPDATE, not create new
    const isOnboardingStep = onboardingStepRoutes.some(route => pathname === route);

    if (user && isOnboardingStep) {
      // Check if user already has an active article style
      const { data: existingStyle } = await supabase
        .from('article_styles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingStyle) {
        // User already has a style - redirect to dashboard
        // They can update their style from dashboard, not create new via onboarding
        console.log(
          '[Middleware] Logged-in user with existing style trying to access onboarding, redirecting to dashboard'
        );
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return supabaseResponse;
  }

  // Protect authenticated routes - redirect to login if not authenticated
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For authenticated users, check subscription status and onboarding completion
  const requiresSubscription = subscriptionRequiredRoutes.some(route => pathname.startsWith(route));
  const isSubscribePage = pathname === '/subscribe';

  if (requiresSubscription || isSubscribePage) {
    // Fetch user profile to check subscription status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    // Log for debugging
    console.log('[Middleware] User ID:', user.id);
    console.log('[Middleware] Profile data:', profile);
    console.log('[Middleware] Profile error:', profileError);
    console.log('[Middleware] Subscription status:', profile?.subscription_status);

    // Active or trialing subscription grants access (treat trialing as active since no free trial)
    const hasActiveSubscription =
      profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing';

    console.log('[Middleware] Has active subscription:', hasActiveSubscription);
    console.log('[Middleware] Path:', pathname);

    // If on subscribe page but already has subscription, redirect to dashboard
    if (isSubscribePage && hasActiveSubscription) {
      console.log('[Middleware] Redirecting from subscribe to dashboard (has subscription)');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If trying to access subscription-required routes without subscription
    // Allow access to dashboard for expired subscriptions (read-only mode with renewal banner)
    // But redirect incomplete subscriptions to subscribe page
    if (requiresSubscription && !hasActiveSubscription) {
      const isExpiredSubscription =
        profile?.subscription_status === 'past_due' || profile?.subscription_status === 'canceled';

      // Allow expired subscriptions to access dashboard (read-only mode)
      if (isExpiredSubscription && pathname.startsWith('/dashboard')) {
        console.log('[Middleware] Allowing expired subscription to access dashboard (read-only)');
        // Continue to dashboard - UI will show expiration banner and disable features
      } else {
        console.log('[Middleware] Redirecting to subscribe (no active subscription)');
        return NextResponse.redirect(new URL('/subscribe', request.url));
      }
    }

    // Check if user has completed onboarding (has an active article style)
    // Only check for dashboard access, not other subscription routes
    if (pathname === '/dashboard' && hasActiveSubscription) {
      const { data: articleStyle, error: styleError } = await supabase
        .from('article_styles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      console.log('[Middleware] Article style query result:', articleStyle);
      console.log('[Middleware] Article style query error:', styleError);

      const hasCompletedOnboarding = !!articleStyle;
      console.log(
        '[Middleware] Has completed onboarding (has article style):',
        hasCompletedOnboarding
      );

      // If no article style, check for pending style data
      // Users with pending style data have completed onboarding but payment webhook hasn't processed yet
      if (!hasCompletedOnboarding && !styleError) {
        const { data: pendingStyle } = await supabase
          .from('pending_style_data')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('[Middleware] Pending style data:', pendingStyle);

        if (pendingStyle) {
          // User has pending style data - allow access to dashboard
          // The webhook should process this data, or we can trigger it manually
          console.log('[Middleware] User has pending style data, allowing dashboard access');
          return supabaseResponse;
        }

        console.log('[Middleware] Redirecting to step-1 (no article style or pending data)');
        return NextResponse.redirect(new URL('/articles/generate/step-1', request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$).*)',
  ],
};
