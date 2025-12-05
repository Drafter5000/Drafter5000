import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const publicRoutes = ['/', '/login', '/signup', '/pricing', '/auth/callback', '/admin/login'];

// Routes that require subscription (active or trialing)
const subscriptionRequiredRoutes = ['/dashboard', '/articles'];

// Routes accessible without subscription (but require auth)
const authOnlyRoutes = ['/subscribe'];

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

  // Protect authenticated routes - redirect to login if not authenticated
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For authenticated users, check subscription status for protected routes
  const requiresSubscription = subscriptionRequiredRoutes.some(route => pathname.startsWith(route));
  const isSubscribePage = pathname === '/subscribe';

  if (requiresSubscription || isSubscribePage) {
    // Fetch user profile to check subscription status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    const hasActiveSubscription =
      profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing';

    // If on subscribe page but already has subscription, redirect to dashboard
    if (isSubscribePage && hasActiveSubscription) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If trying to access subscription-required routes without subscription, redirect to subscribe
    if (requiresSubscription && !hasActiveSubscription) {
      return NextResponse.redirect(new URL('/subscribe', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
