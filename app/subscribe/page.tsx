'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Header } from '@/components/header';
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
} from 'lucide-react';
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
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState(7);

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
        const plans = await apiClient.get<SubscriptionPlan[]>('/stripe/plans');
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
  }, [user, router]);

  const handleSubscribe = async () => {
    if (!plan) return;

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ sessionUrl: string }>('/stripe/checkout', {
        plan_id: plan.id,
        trial_days: trialDays,
        success_url: `${window.location.origin}/onboarding/step-1`,
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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Header />
        <main className="pt-32 pb-20 px-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Header />
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
