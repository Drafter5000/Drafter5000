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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes - they handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
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

      // Only active subscription grants access (no trial)
      const hasActiveSubscription = profile?.subscription_status === 'active';

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
    // Fetch user profile to check subscription status and onboarding
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_status, onboarding_completed')
      .eq('id', user.id)
      .single();

    // Only active subscription grants access (no trial)
    const hasActiveSubscription = profile?.subscription_status === 'active';
    const hasCompletedOnboarding = profile?.onboarding_completed === true;

    // If on subscribe page but already has subscription, redirect to dashboard
    if (isSubscribePage && hasActiveSubscription) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If trying to access subscription-required routes without subscription, redirect to subscribe
    if (requiresSubscription && !hasActiveSubscription) {
      return NextResponse.redirect(new URL('/subscribe', request.url));
    }

    // If trying to access dashboard but onboarding not completed, redirect to step 1
    if (requiresSubscription && hasActiveSubscription && !hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/articles/generate/step-1', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
