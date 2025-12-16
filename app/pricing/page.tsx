'use client';

import { MarketingHeader } from '@/components/marketing-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Zap, AlertCircle, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/components/auth-provider';
import { usePlans } from '@/hooks/use-plans';
import type { SubscriptionPlanWithFeatures } from '@/lib/types';

function PlanCardSkeleton() {
  return (
    <Card className="border-2 flex flex-col">
      <CardHeader>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-40 mt-2" />
        <div className="mt-6">
          <Skeleton className="h-12 w-32" />
        </div>
        <Skeleton className="h-4 w-36 mt-3" />
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(0)}`;
}

function getCtaText(plan: SubscriptionPlanWithFeatures, isNewUser: boolean): string {
  if (plan.cta_text) return plan.cta_text;
  if (plan.price_cents === 0) return 'Get Started';
  if (plan.cta_type === 'email') return 'Contact Sales';
  return isNewUser ? 'Select Plan' : 'Subscribe Now';
}

function PricingContent() {
  const { user } = useAuth();
  const { plans, loading, error } = usePlans();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Check for URL parameters indicating signup success or payment cancellation
  // Requirements: 6.4, 8.3
  const fromSignup = searchParams.get('from') === 'signup';
  const paymentCancelled = searchParams.get('cancelled') === 'true';
  const paymentError = searchParams.get('error');

  useEffect(() => {
    if (fromSignup || paymentCancelled || paymentError) {
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', '/pricing');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [fromSignup, paymentCancelled, paymentError]);

  const handleCheckout = async (plan: SubscriptionPlanWithFeatures) => {
    setCheckoutError(null);

    // Handle email CTA type
    if (plan.cta_type === 'email') {
      window.location.href = 'mailto:sales@drafter.com';
      return;
    }

    // Handle signup CTA type (free plan)
    if (plan.cta_type === 'signup' || plan.price_cents === 0) {
      window.location.href = user ? '/dashboard' : '/articles/generate/step-1';
      return;
    }

    // Handle checkout CTA type
    if (!user) {
      window.location.href = '/articles/generate/step-1';
      return;
    }

    setCheckoutLoading(plan.id);
    try {
      const { sessionUrl } = await apiClient.post<{ sessionUrl: string }>('/stripe/checkout', {
        plan_id: plan.id,
      });
      window.location.href = sessionUrl;
    } catch (err) {
      console.error('Checkout error:', err);
      // Requirements: 8.3
      const message =
        err instanceof Error ? err.message : 'Failed to start checkout. Please try again.';
      setCheckoutError(message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <MarketingHeader hideNavLinks />
      <main className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-sm font-medium border border-primary/20 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span>Simple, Transparent Pricing</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {fromSignup ? 'Choose Your Plan' : 'Plans for every creator'}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {fromSignup
                ? 'Your account is ready! Select a plan to activate your personalized articles.'
                : 'Choose the perfect plan for your content needs. Cancel anytime.'}
            </p>
          </div>

          {/* Success message after signup */}
          {fromSignup && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Account created successfully!</p>
                <p className="text-sm text-green-700">
                  Select a plan below to start receiving your personalized articles.
                </p>
              </div>
            </div>
          )}

          {/* Payment cancelled message */}
          {paymentCancelled && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
              <XCircle className="h-5 w-5 text-yellow-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Payment cancelled</p>
                <p className="text-sm text-yellow-700">
                  No worries! You can select a plan whenever you're ready.
                </p>
              </div>
            </div>
          )}

          {/* Payment error message */}
          {paymentError && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Payment failed</p>
                <p className="text-sm text-destructive/80">{decodeURIComponent(paymentError)}</p>
              </div>
            </div>
          )}

          {/* Checkout error message */}
          {checkoutError && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Checkout Error</p>
                <p className="text-sm text-destructive/80">{checkoutError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setCheckoutError(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div
            className={`grid gap-6 mx-auto ${
              !loading && plans.length === 1
                ? 'grid-cols-1 max-w-sm justify-center'
                : !loading && plans.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                  : !loading && plans.length === 4
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl'
            }`}
          >
            {loading ? (
              <>
                <PlanCardSkeleton />
                <PlanCardSkeleton />
                <PlanCardSkeleton />
              </>
            ) : (
              plans.map(plan => (
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
                      <span className="text-5xl font-bold">{formatPrice(plan.price_cents)}</span>
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
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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
                      {checkoutLoading === plan.id ? 'Processing...' : getCtaText(plan, fromSignup)}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          {/* Money-Back Guarantee */}
          <div className="mt-12 max-w-md mx-auto">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
              <ShieldCheck className="h-6 w-6 text-green-600 shrink-0" />
              <p className="text-sm text-green-800">
                7-day guarantee. If you're not happy, we'll refund you completely. No questions
                asked.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PricingPageFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <MarketingHeader hideNavLinks />
      <main className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-8 w-48 mx-auto mb-6" />
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>
          <div className="grid gap-6 mx-auto grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
            <PlanCardSkeleton />
            <PlanCardSkeleton />
            <PlanCardSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageFallback />}>
      <PricingContent />
    </Suspense>
  );
}
