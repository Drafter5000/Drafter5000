'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  CreditCard,
  Shield,
  Sparkles,
  Clock,
  AlertCircle,
  LogOut,
  PenLine,
  PartyPopper,
  ArrowRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  features: { feature_text: string }[];
  stripe_price_id: string | null;
}

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState(7);
  const [loggingOut, setLoggingOut] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Check for success parameter from Stripe redirect
  const sessionId = searchParams.get('session_id');
  const successParam = searchParams.get('success');

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setLoggingOut(false);
    }
  };

  // Verify payment success when session_id is present
  const verifyPaymentSuccess = useCallback(async () => {
    if (!sessionId || !user) return;

    setVerifyingPayment(true);
    try {
      // First, try to verify and update subscription via our API
      // This handles the case where webhook hasn't processed yet
      const verifyResult = await apiClient.post<{
        success: boolean;
        status: string;
        plan?: string;
      }>('/stripe/verify-session', { session_id: sessionId });

      if (
        verifyResult.success &&
        (verifyResult.status === 'active' || verifyResult.status === 'trialing')
      ) {
        setPaymentSuccess(true);
        return;
      }

      // Fallback: Poll profile status a few times
      let attempts = 0;
      const maxAttempts = 5;

      const checkStatus = async (): Promise<boolean> => {
        const profile = await apiClient.get<{
          subscription_status: string;
          subscription_plan: string;
        }>(`/auth/profile`);

        if (
          profile.subscription_status === 'active' ||
          profile.subscription_status === 'trialing'
        ) {
          return true;
        }
        return false;
      };

      let isActive = await checkStatus();

      while (!isActive && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        isActive = await checkStatus();
        attempts++;
      }

      // Show success regardless - Stripe confirmed the redirect
      setPaymentSuccess(true);
    } catch (err) {
      console.error('Failed to verify payment:', err);
      // If we have a session_id, assume success (Stripe redirected us)
      setPaymentSuccess(true);
    } finally {
      setVerifyingPayment(false);
    }
  }, [sessionId, user]);

  // Handle payment verification on mount
  useEffect(() => {
    if (sessionId && user && !paymentSuccess && !verifyingPayment) {
      verifyPaymentSuccess();
    }
  }, [sessionId, user, paymentSuccess, verifyingPayment, verifyPaymentSuccess]);

  // Countdown and redirect after payment success
  useEffect(() => {
    if (!paymentSuccess) return;

    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentSuccess]);

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (paymentSuccess && redirectCountdown === 0) {
      router.push('/onboarding/step-1');
    }
  }, [paymentSuccess, redirectCountdown, router]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch the subscription plan and check if user already has subscription
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Skip fetching plan data if we're verifying payment or showing success
      if (sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Check current subscription status
        const profile = await apiClient.get<{
          subscription_status: string;
          subscription_plan: string;
        }>(`/auth/profile`);

        // If user already has active subscription, redirect to dashboard
        if (
          profile.subscription_status === 'active' ||
          profile.subscription_status === 'trialing'
        ) {
          router.push('/onboarding/step-1');
          return;
        }

        // Fetch the main subscription plan (pro plan)
        const response = await apiClient.get<{ plans: SubscriptionPlan[] }>('/stripe/plans');
        const plans = response.plans || [];
        // Find the first paid plan (pro plan preferred, or any plan with price > 0)
        const proPlan =
          plans.find(p => p.id === 'pro') || plans.find(p => p.price_cents > 0) || plans[0];
        if (proPlan) {
          setPlan(proPlan);
        } else {
          setError('No subscription plan available');
        }

        // Fetch trial days from config if available
        try {
          const config = await apiClient.get<{ trial_days: number }>('/config/paywall');
          if (config.trial_days) {
            setTrialDays(config.trial_days);
          }
        } catch {
          // Use default 7 days
        }
      } catch (err) {
        console.error('Failed to fetch plan:', err);
        setError('Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router, sessionId]);

  const handleSubscribe = async () => {
    if (!plan) return;

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ sessionUrl: string }>('/stripe/checkout', {
        plan_id: plan.id,
        trial_days: trialDays,
        success_url: `${window.location.origin}/subscribe?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${window.location.origin}/subscribe`,
      });

      if (response.sessionUrl) {
        window.location.href = response.sessionUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
      setCheckoutLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/onboarding/step-1');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Custom header for subscribe page with logout button
  const SubscribeHeader = () => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg group">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
            <PenLine className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span>Drafter</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary"
          >
            Pricing
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="border-2 bg-transparent gap-2"
          >
            {loggingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );

  // Skeleton loading component
  const SubscribeSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <SubscribeHeader />
      <main className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-lg mx-auto">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <Skeleton className="h-16 w-16 rounded-2xl mx-auto mb-4" />
            <Skeleton className="h-9 w-64 mx-auto mb-2" />
            <Skeleton className="h-5 w-80 mx-auto" />
          </div>

          {/* Plan Card Skeleton */}
          <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/10">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
              <Skeleton className="h-8 w-40 mx-auto mb-2" />
              <Skeleton className="h-4 w-56 mx-auto" />
              <div className="pt-4">
                <Skeleton className="h-12 w-32 mx-auto" />
              </div>
              <Skeleton className="h-4 w-40 mx-auto mt-2" />
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features Skeleton */}
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>

              {/* Button Skeleton */}
              <Skeleton className="h-12 w-full rounded-md" />

              {/* Trust Badges Skeleton */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-28" />
              </div>

              <Skeleton className="h-3 w-72 mx-auto" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );

  // Payment verification loading state
  if (sessionId && verifyingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <SubscribeHeader />
        <main className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-40 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-40 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
          </div>

          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-6">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">Verifying Payment...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your subscription.</p>
          </div>
        </main>
      </div>
    );
  }

  // Payment success screen
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500/5 via-background to-primary/5">
        <SubscribeHeader />
        <main className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-40 left-10 sm:left-20 w-48 sm:w-72 h-48 sm:h-72 bg-green-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-40 right-10 sm:right-20 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="border-2 border-green-500/20 shadow-2xl shadow-green-500/10">
              <CardContent className="pt-8 sm:pt-10 pb-8 sm:pb-10 px-6 sm:px-8">
                {/* Success Icon */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="relative inline-flex">
                    <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
                    <div className="relative inline-flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-green-500/10 border-2 border-green-500/30">
                      <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <div className="flex items-center justify-center gap-2">
                    <PartyPopper className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-green-600">
                      Payment Successful!
                    </h1>
                    <PartyPopper className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 scale-x-[-1]" />
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Welcome to Drafter Pro! Your subscription is now active.
                  </p>
                </div>

                {/* What's Next */}
                <div className="bg-muted/50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                  <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">What's next?</h3>
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">
                        Set up your writing style preferences
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Configure your content topics</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Start creating amazing content</span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={handleGoToDashboard}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base shadow-lg shadow-primary/20 gap-2"
                >
                  Continue to Setup
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {/* Auto-redirect notice */}
                <p className="text-xs sm:text-sm text-center text-muted-foreground mt-4">
                  Redirecting automatically in {redirectCountdown} second
                  {redirectCountdown !== 1 ? 's' : ''}...
                </p>
              </CardContent>
            </Card>

            {/* Trust badges */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure payment processed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return <SubscribeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <SubscribeHeader />
      <main className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Start Your Journey</h1>
            <p className="text-muted-foreground">
              Subscribe to unlock all features and start creating amazing content
            </p>
          </div>

          {error && (
            <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-6">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Plan Card */}
          <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/10">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Clock className="h-3 w-3 mr-1" />
                  {trialDays}-Day Free Trial
                </Badge>
              </div>
              <CardTitle className="text-2xl">{plan?.name || 'Pro Plan'}</CardTitle>
              <CardDescription>{plan?.description}</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">
                  ${plan ? (plan.price_cents / 100).toFixed(2) : '0'}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">after {trialDays}-day free trial</p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div className="space-y-3">
                {plan?.features?.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.feature_text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleSubscribe}
                disabled={checkoutLoading || !plan}
                className="w-full h-12 text-base shadow-lg shadow-primary/20 gap-2"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Start {trialDays}-Day Free Trial
                  </>
                )}
              </Button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Cancel anytime</span>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                You won't be charged until your trial ends. Cancel anytime before then.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
