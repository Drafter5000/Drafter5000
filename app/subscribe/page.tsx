'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  CheckCircle2,
  CreditCard,
  Shield,
  Sparkles,
  AlertCircle,
  LogOut,
  PenLine,
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

// Custom header for subscribe page with logout button
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
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary"
          >
            Pricing
          </Link>
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
            <Skeleton className="h-8 w-16" />
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

// Main subscribe content component
function SubscribeContent() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

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
    const fetchData = async () => {
      if (!user) return;

      try {
        const profile = await apiClient.get<{
          subscription_status: string;
          subscription_plan: string;
        }>(`/auth/profile`);

        if (profile.subscription_status === 'active') {
          router.push('/dashboard');
          return;
        }

        const response = await apiClient.get<{ plans: SubscriptionPlan[] }>('/stripe/plans');
        const plans = response.plans || [];
        const proPlan =
          plans.find(p => p.id === 'pro') || plans.find(p => p.price_cents > 0) || plans[0];
        if (proPlan) {
          setPlan(proPlan);
        } else {
          setError('No subscription plan available');
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
        success_url: `${window.location.origin}/dashboard?payment_success=true`,
        cancel_url: `${window.location.origin}/subscribe`,
      });

      if (response.sessionUrl) {
        window.location.href = response.sessionUrl;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(errorMessage);
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
    return <SubscribeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <SubscribeHeader onLogout={handleLogout} loggingOut={loggingOut} />
      <main className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
            <p className="text-muted-foreground">
              Subscribe to unlock all features and start creating amazing content
            </p>
          </div>

          {error && (
            <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-6">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/10">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{plan?.name || 'Pro Plan'}</CardTitle>
              <CardDescription>{plan?.description}</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">
                  ${plan ? (plan.price_cents / 100).toFixed(2) : '0'}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">billed monthly</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                {plan?.features?.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.feature_text}</span>
                  </div>
                ))}
              </div>

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
                    Subscribe Now
                  </>
                )}
              </Button>

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
                Your subscription will start immediately. Cancel anytime.
              </p>
            </CardContent>
          </Card>
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
