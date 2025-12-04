'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import {
  CreditCard,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import type { SubscriptionPlanWithFeatures } from '@/lib/types';

function BillingPageSkeleton() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <DashboardHeader />

        <main className="pt-10 pb-20 px-6">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-6 w-80" />
              </div>
              <Skeleton className="h-10 w-44 rounded-md" />
            </div>

            {/* Current Plan Card Skeleton */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Skeleton className="h-8 w-40 mb-2" />
                    <Skeleton className="h-5 w-56" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-5 w-36" />
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-28" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <div className="grid md:grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Card Skeleton */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="h-5 w-56 mt-1" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-3 w-full rounded-full" />
                  <Skeleton className="h-3 w-40 mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Options Skeleton */}
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-64 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="p-4 rounded-lg bg-background border-2 border-border">
                      <Skeleton className="h-6 w-24 mb-2" />
                      <Skeleton className="h-9 w-28 mb-3" />
                      <Skeleton className="h-4 w-36 mb-4" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

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

  if (loading) {
    return <BillingPageSkeleton />;
  }

  const currentPlan = plans.find(p => p.id === usage?.plan) || plans.find(p => p.id === 'free');
  const planDetails = currentPlan
    ? {
        name: currentPlan.name,
        price: currentPlan.price_cents,
        articles_per_month: currentPlan.articles_per_month,
        features: currentPlan.features.map(f => f.feature_text),
      }
    : { name: 'Free', price: 0, articles_per_month: 2, features: [] };
  const statusColor =
    subscription?.status === 'active'
      ? 'bg-green-500/10 text-green-600 border-green-500/20'
      : subscription?.status === 'past_due'
        ? 'bg-red-500/10 text-red-600 border-red-500/20'
        : subscription?.status === 'canceled'
          ? 'bg-gray-500/10 text-gray-600 border-gray-500/20'
          : 'bg-blue-500/10 text-blue-600 border-blue-500/20';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <DashboardHeader />

        <main className="pt-10 pb-20 px-6">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Billing & Usage</h2>
                <p className="text-muted-foreground text-lg">
                  Manage your subscription and track usage
                </p>
              </div>
              {usage?.plan !== 'free' && (
                <Button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="gap-2"
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Manage Subscription
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Current Plan Card */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{planDetails.name} Plan</CardTitle>
                    <CardDescription>
                      {usage?.plan === 'free'
                        ? 'Get started with basic features'
                        : 'Your current subscription'}
                    </CardDescription>
                  </div>
                  <Badge className={`${statusColor} border`}>
                    {subscription?.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {subscription?.status === 'past_due' && (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {subscription?.status || 'Active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">${planDetails.price / 100}</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>

                {subscription?.cancel_at_period_end && (
                  <div className="flex gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Subscription Canceling</p>
                      <p className="text-sm">
                        Your subscription will end on{' '}
                        {subscription.current_period_end &&
                          new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {subscription?.status === 'past_due' && (
                  <div className="flex gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Payment Failed</p>
                      <p className="text-sm">
                        Please update your payment method to continue your subscription
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {subscription?.current_period_end && (
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <p className="text-xs uppercase tracking-wider font-medium">
                          Next Billing Date
                        </p>
                      </div>
                      <p className="font-semibold">
                        {new Date(subscription.current_period_end * 1000).toLocaleDateString(
                          'en-US',
                          {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </p>
                    </div>
                  )}
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-wider font-medium">Articles Limit</p>
                    </div>
                    <p className="font-semibold">{planDetails.articles_per_month} per month</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Features included:</p>
                  <ul className="grid md:grid-cols-2 gap-2">
                    {planDetails.features.map(feature => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Usage Card */}
            {usage && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Usage This Month
                  </CardTitle>
                  <CardDescription>Track your article generation usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Articles Generated</span>
                      <span className="text-sm text-muted-foreground">
                        {usage.articles_used} / {usage.articles_limit}
                      </span>
                    </div>
                    <Progress value={usage.percentage_used} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {usage.can_generate
                        ? `${usage.articles_limit - usage.articles_used} articles remaining`
                        : "You've reached your monthly limit"}
                    </p>
                  </div>

                  {!usage.can_generate && usage.plan === 'free' && (
                    <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-primary">
                          Upgrade to generate more articles
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upgrade to Pro for 20 articles/month or Enterprise for 100 articles/month
                        </p>
                        <Link href="/pricing">
                          <Button size="sm" className="mt-3 gap-2">
                            View Plans <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upgrade Options */}
            {usage?.plan === 'free' && (
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle>Upgrade Your Plan</CardTitle>
                  <CardDescription>Get more articles and advanced features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-background border-2 border-border">
                      <h3 className="font-bold text-lg mb-2">Pro Plan</h3>
                      <p className="text-3xl font-bold mb-3">$70/mo</p>
                      <p className="text-sm text-muted-foreground mb-4">20 articles per month</p>
                      <Link href="/pricing">
                        <Button className="w-full">Upgrade to Pro</Button>
                      </Link>
                    </div>
                    <div className="p-4 rounded-lg bg-background border-2 border-border">
                      <h3 className="font-bold text-lg mb-2">Enterprise Plan</h3>
                      <p className="text-3xl font-bold mb-3">$299/mo</p>
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
        </main>
      </div>
    </ProtectedRoute>
  );
}
