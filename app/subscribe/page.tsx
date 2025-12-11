'use client';

import { useAuth } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlans } from '@/hooks/use-plans';
import { apiClient } from '@/lib/api-client';
import type { SubscriptionPlanWithFeatures } from '@/lib/types';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  LogOut,
  PenLine,
  Shield,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { PaymentVerification } from '@/components/payment-verification';

// Custom header for subscribe page with logout button only
function SubscribeHeader({ onLogout, loggingOut }: { onLogout: () => void; loggingOut: boolean }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg group">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
            <PenLine className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span>Drafter</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
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
}

// Skeleton loading component
function SubscribeSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </header>
      <main className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-16 w-16 rounded-2xl mx-auto mb-4" />
            <Skeleton className="h-9 w-64 mx-auto mb-2" />
            <Skeleton className="h-5 w-80 mx-auto" />
          </div>

          <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/10">
            <CardHeader className="text-center pb-4">
              <Skeleton className="h-8 w-40 mx-auto mb-2" />
              <Skeleton className="h-4 w-56 mx-auto" />
              <div className="pt-4">
                <Skeleton className="h-12 w-32 mx-auto" />
              </div>
              <Skeleton className="h-4 w-40 mx-auto mt-2" />
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>

              <Skeleton className="h-12 w-full rounded-md" />

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
}

function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(0)}`;
}

function getCtaText(plan: SubscriptionPlanWithFeatures): string {
  if (plan.cta_text) return plan.cta_text;
  if (plan.price_cents === 0) return 'Get Started';
  if (plan.cta_type === 'email') return 'Contact Sales';
  return 'Subscribe Now';
}

// Main subscribe content component
function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const { plans, loading, error: plansError } = usePlans();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Check for session_id from Stripe checkout return
  const sessionId = searchParams.get('session_id');
  const [isVerifying, setIsVerifying] = useState(!!sessionId);
  const [verificationStarted, setVerificationStarted] = useState(false);

  // Mark verification as started when we have a session_id
  useEffect(() => {
    if (sessionId && !verificationStarted) {
      setVerificationStarted(true);
      setIsVerifying(true);
    }
  }, [sessionId, verificationStarted]);

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const checkSubscription = async () => {
      // Don't check subscription if we're in the middle of verification
      if (!user || isVerifying || sessionId) return;

      try {
        const profile = await apiClient.get<{
          subscription_status: string;
          subscription_plan: string;
        }>(`/auth/profile`);

        if (profile.subscription_status === 'active') {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Failed to check subscription:', err);
      }
    };

    checkSubscription();
  }, [user, router, isVerifying, sessionId]);

  const handleCheckout = async (plan: SubscriptionPlanWithFeatures) => {
    // Handle email CTA type
    if (plan.cta_type === 'email') {
      window.location.href = 'mailto:sales@drafter.com';
      return;
    }

    // Handle signup CTA type (free plan)
    if (plan.cta_type === 'signup' || plan.price_cents === 0) {
      router.push('/dashboard');
      return;
    }

    setCheckoutLoading(plan.id);
    setError(null);

    try {
      const response = await apiClient.post<{ sessionUrl: string }>('/stripe/checkout', {
        plan_id: plan.id,
        success_url: `${window.location.origin}/subscribe?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/subscribe`,
      });

      if (response.sessionUrl) {
        window.location.href = response.sessionUrl;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(errorMessage);
      setCheckoutLoading(null);
    }
  };

  // Show payment verification flow when returning from Stripe checkout
  // This should take priority over auth loading to prevent flashing
  if (isVerifying && sessionId) {
    return (
      <PaymentVerification
        sessionId={sessionId}
        onComplete={() => {
          // Don't set isVerifying to false - the redirect will happen in the component
          // This prevents showing the pricing screen briefly before redirect
        }}
        onError={err => {
          console.error('Verification error:', err);
          setIsVerifying(false);
          setVerificationStarted(false);
          setError(err);
        }}
      />
    );
  }

  // Show loading state only if not verifying
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loading) {
    return <SubscribeSkeleton />;
  }

  const displayError = error || plansError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <SubscribeHeader onLogout={handleLogout} loggingOut={loggingOut} />
      <main className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-sm font-medium border border-primary/20 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span>Choose Your Plan</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Activate Your Writing Style</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Subscribe to unlock all features and start receiving your personalized articles
            </p>
          </div>

          {displayError && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{displayError}</p>
            </div>
          )}

          <div
            className={`grid gap-6 mx-auto ${
              plans.length === 1
                ? 'grid-cols-1 max-w-sm justify-center'
                : plans.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                  : plans.length === 4
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl'
            }`}
          >
            {plans.map(plan => (
              <Card
                key={plan.id}
                className={`border-2 relative flex flex-col transition-all hover:shadow-lg ${
                  plan.is_highlighted
                    ? 'border-primary/50 shadow-xl shadow-primary/10 md:scale-105 md:z-10'
                    : 'border-border'
                }`}
              >
                {plan.is_highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className={plan.is_highlighted ? 'pt-8' : ''}>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="text-5xl font-bold">${formatPrice(plan.price_cents)}</span>
                    <span className="text-muted-foreground"> / month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    {plan.articles_per_month} articles per month
                  </p>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="space-y-4">
                    {plan.features.map(feature => (
                      <div key={feature.id} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature.feature_text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleCheckout(plan)}
                    disabled={checkoutLoading === plan.id}
                    variant={plan.is_highlighted ? 'default' : 'outline'}
                    className="w-full gap-2 shadow-lg shadow-primary/20"
                  >
                    {checkoutLoading === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        {getCtaText(plan)}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-5 w-5" />
              <span>Secure checkout</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main page component with Suspense boundary
export default function SubscribePage() {
  return (
    <Suspense fallback={<SubscribeSkeleton />}>
      <SubscribeContent />
    </Suspense>
  );
}
