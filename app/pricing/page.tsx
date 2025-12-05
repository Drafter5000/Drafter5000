'use client';

import { Header } from '@/components/header';
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
import { Check, Zap, AlertCircle } from 'lucide-react';
import { useState } from 'react';
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

function getCtaText(plan: SubscriptionPlanWithFeatures): string {
  if (plan.cta_text) return plan.cta_text;
  if (plan.price_cents === 0) return 'Get Started';
  if (plan.cta_type === 'email') return 'Contact Sales';
  return 'Start Free Trial';
}

export default function PricingPage() {
  const { user } = useAuth();
  const { plans, loading, error } = usePlans();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: SubscriptionPlanWithFeatures) => {
    // Handle email CTA type
    if (plan.cta_type === 'email') {
      window.location.href = 'mailto:sales@drafter.com';
      return;
    }

    // Handle signup CTA type (free plan)
    if (plan.cta_type === 'signup' || plan.price_cents === 0) {
      window.location.href = user ? '/dashboard' : '/signup';
      return;
    }

    // Handle checkout CTA type
    if (!user) {
      window.location.href = '/signup';
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
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Header />
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Plans for every creator</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Start free and upgrade anytime. No credit card required to get started.
            </p>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div
            className={`grid gap-6 max-w-6xl mx-auto ${
              !loading && plans.length === 1
                ? 'grid-cols-1 max-w-sm'
                : !loading && plans.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                  : 'grid-cols-1 md:grid-cols-3'
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
                      {checkoutLoading === plan.id ? 'Processing...' : getCtaText(plan)}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          <div className="mt-20 max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">Free Trial</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Start with our Free plan. No credit card required. Upgrade anytime.
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">Money-Back Guarantee</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  30-day guarantee. If you're not happy, we'll refund you completely.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
