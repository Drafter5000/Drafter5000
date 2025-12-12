'use client';

import { useEffect, useState, useContext } from 'react';
import { useAuth } from '@/components/auth-provider';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import {
  Win95Window,
  Win95Button,
  Win95Badge,
  Win95Alert,
  Win95Progress,
} from '@/components/win95';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import {
  CreditCard,
  Calendar,
  Zap,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import type { SubscriptionPlanWithFeatures } from '@/lib/types';

interface UsageData {
  plan: 'free' | 'pro' | 'enterprise';
  articles_used: number;
  articles_limit: number;
  percentage_used: number;
  can_generate: boolean;
}

interface SubscriptionData {
  plan: string;
  status: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  canceled_at?: number;
}

interface PlansResponse {
  plans: SubscriptionPlanWithFeatures[];
}

export default function BillingPage() {
  const { user } = useAuth();
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const [usageData, subscriptionData, plansData] = await Promise.all([
          apiClient.get<UsageData>('/stripe/usage'),
          apiClient.get<SubscriptionData>('/stripe/subscription'),
          apiClient.get<PlansResponse>('/stripe/plans'),
        ]);
        setUsage(usageData);
        setSubscription(subscriptionData);
        setPlans(plansData.plans);
      } catch (error) {
        console.error('Billing data error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [user]);

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const { url } = await apiClient.post<{ url: string }>('/stripe/portal', {});
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      setPortalLoading(false);
    }
  };

  const currentPlan = plans.find(p => p.id === usage?.plan) || plans.find(p => p.id === 'free');
  const planDetails = currentPlan
    ? {
        name: currentPlan.name,
        price: currentPlan.price_cents,
        articles_per_month: currentPlan.articles_per_month,
        features: currentPlan.features.map(f => f.feature_text),
      }
    : { name: 'Free', price: 0, articles_per_month: 2, features: [] };

  // Win95 Design
  if (designMode === 'win95') {
    if (loading) {
      return (
        <ProtectedRoute>
          <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto">
              <DashboardHeader />
              <Win95Window title="Billing & Usage" icon={<span>💳</span>}>
                <div className="text-center py-8">
                  <span className="text-[11px] win95-loading">Loading billing data...</span>
                </div>
              </Win95Window>
            </div>
          </div>
        </ProtectedRoute>
      );
    }

    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto">
            <DashboardHeader />

            <Win95Window title="Billing & Usage" icon={<span>💳</span>}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="win95-sunken p-2 flex items-center gap-2">
                    <span className="text-[16px]">💳</span>
                    <div>
                      <h2 className="text-[12px] font-bold">Billing & Usage</h2>
                      <p className="text-[10px] text-[var(--win95-button-shadow)]">
                        Manage your subscription and track usage
                      </p>
                    </div>
                  </div>
                  {usage?.plan !== 'free' && (
                    <Win95Button onClick={handleManageSubscription} disabled={portalLoading}>
                      {portalLoading ? 'Loading...' : '💳 Manage Subscription'}
                    </Win95Button>
                  )}
                </div>

                <div className="win95-groupbox">
                  <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                    <legend className="win95-groupbox-title font-bold">📋 Current Plan</legend>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-[14px] font-bold">{planDetails.name} Plan</h3>
                        <p className="text-[10px] text-[var(--win95-button-shadow)]">
                          {usage?.plan === 'free'
                            ? 'Get started with basic features'
                            : 'Your current subscription'}
                        </p>
                      </div>
                      <Win95Badge
                        variant={subscription?.status === 'active' ? 'default' : 'secondary'}
                      >
                        {subscription?.status === 'active'
                          ? '✓ Active'
                          : subscription?.status || 'Active'}
                      </Win95Badge>
                    </div>
                    <div className="win95-sunken p-2 mb-3">
                      <span className="text-[24px] font-bold">${planDetails.price / 100}</span>
                      <span className="text-[11px]"> / month</span>
                    </div>
                  </fieldset>
                </div>

                {usage && (
                  <div className="win95-groupbox">
                    <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                      <legend className="win95-groupbox-title font-bold">
                        ⚡ Usage This Month
                      </legend>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold">Articles Generated</span>
                          <span className="text-[11px]">
                            {usage.articles_used} / {usage.articles_limit}
                          </span>
                        </div>
                        <Win95Progress value={usage.percentage_used} />
                        <p className="text-[10px] text-[var(--win95-button-shadow)] mt-1">
                          {usage.can_generate
                            ? `${usage.articles_limit - usage.articles_used} articles remaining`
                            : "You've reached your monthly limit"}
                        </p>
                      </div>
                    </fieldset>
                  </div>
                )}

                {usage?.plan === 'free' && (
                  <div className="win95-groupbox">
                    <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                      <legend className="win95-groupbox-title font-bold">
                        🚀 Upgrade Your Plan
                      </legend>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="win95-raised p-3 text-center">
                          <h3 className="text-[12px] font-bold mb-1">Pro Plan</h3>
                          <p className="text-[20px] font-bold mb-1">$70/mo</p>
                          <p className="text-[10px] text-[var(--win95-button-shadow)] mb-3">
                            20 articles per month
                          </p>
                          <Link href="/pricing">
                            <Win95Button className="w-full">Upgrade to Pro</Win95Button>
                          </Link>
                        </div>
                        <div className="win95-raised p-3 text-center">
                          <h3 className="text-[12px] font-bold mb-1">Enterprise Plan</h3>
                          <p className="text-[20px] font-bold mb-1">$299/mo</p>
                          <p className="text-[10px] text-[var(--win95-button-shadow)] mb-3">
                            100 articles per month
                          </p>
                          <Link href="/pricing">
                            <Win95Button className="w-full">Upgrade to Enterprise</Win95Button>
                          </Link>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                )}

                <div className="pt-2">
                  <Link href="/dashboard">
                    <Win95Button size="sm">← Back to Dashboard</Win95Button>
                  </Link>
                </div>
              </div>
            </Win95Window>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Modern Design
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <main className="pt-8 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
              {/* Header Skeleton */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-40 rounded-md" />
                  <Skeleton className="h-10 w-24 rounded-md" />
                </div>
              </div>

              <div className="space-y-6">
                {/* Current Plan Card Skeleton */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-5 rounded" />
                          <Skeleton className="h-6 w-28" />
                        </div>
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2 mb-4">
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/50 border space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="h-5 w-36" />
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 border space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-5 w-28" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Card Skeleton */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-6 w-36" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                    <Skeleton className="h-4 w-40 mt-2" />
                  </CardContent>
                </Card>

                {/* Upgrade Card Skeleton */}
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-44" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[1, 2].map(i => (
                        <div key={i} className="p-6 rounded-lg border text-center space-y-3">
                          <Skeleton className="h-5 w-24 mx-auto" />
                          <Skeleton className="h-9 w-28 mx-auto" />
                          <Skeleton className="h-4 w-36 mx-auto" />
                          <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="pt-8 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Billing & Usage</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your subscription and track usage
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {usage?.plan !== 'free' && (
                  <Button onClick={handleManageSubscription} disabled={portalLoading}>
                    {portalLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Manage Subscription'
                    )}
                  </Button>
                )}
                <Link href="/dashboard">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Current Plan
                      </CardTitle>
                      <CardDescription>
                        {usage?.plan === 'free'
                          ? 'Get started with basic features'
                          : 'Your current subscription'}
                      </CardDescription>
                    </div>
                    <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                      {subscription?.status === 'active' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        subscription?.status || 'Active'
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-bold">${planDetails.price / 100}</span>
                    <span className="text-muted-foreground">/ month</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {subscription?.current_period_end && (
                      <div className="p-4 rounded-lg bg-secondary/50 border">
                        <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Next Billing Date
                        </div>
                        <p className="font-semibold">
                          {new Date(subscription.current_period_end * 1000).toLocaleDateString(
                            'en-US',
                            { month: 'long', day: 'numeric', year: 'numeric' }
                          )}
                        </p>
                      </div>
                    )}
                    <div className="p-4 rounded-lg bg-secondary/50 border">
                      <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        Articles Limit
                      </div>
                      <p className="font-semibold">{planDetails.articles_per_month} per month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {usage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Usage This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Articles Generated</span>
                      <span className="text-muted-foreground">
                        {usage.articles_used} / {usage.articles_limit}
                      </span>
                    </div>
                    <Progress value={usage.percentage_used} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {usage.can_generate
                        ? `${usage.articles_limit - usage.articles_used} articles remaining`
                        : "You've reached your monthly limit"}
                    </p>
                    {!usage.can_generate && usage.plan === 'free' && (
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Upgrade to Pro for 20 articles/month or Enterprise for 100 articles/month.
                          <Link href="/pricing" className="ml-2 text-primary hover:underline">
                            View Plans →
                          </Link>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {usage?.plan === 'free' && (
                <Card>
                  <CardHeader>
                    <CardTitle>🚀 Upgrade Your Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-lg border text-center">
                        <h3 className="font-bold mb-1">Pro Plan</h3>
                        <p className="text-3xl font-bold text-primary mb-1">$70/mo</p>
                        <p className="text-sm text-muted-foreground mb-4">20 articles per month</p>
                        <Link href="/pricing">
                          <Button className="w-full">Upgrade to Pro</Button>
                        </Link>
                      </div>
                      <div className="p-6 rounded-lg border text-center">
                        <h3 className="font-bold mb-1">Enterprise Plan</h3>
                        <p className="text-3xl font-bold text-primary mb-1">$299/mo</p>
                        <p className="text-sm text-muted-foreground mb-4">100 articles per month</p>
                        <Link href="/pricing">
                          <Button className="w-full">Upgrade to Enterprise</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
