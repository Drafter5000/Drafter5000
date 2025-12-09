'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import {
  Win95Window,
  Win95Button,
  Win95Badge,
  Win95Alert,
  Win95Progress,
} from '@/components/win95';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import type { SubscriptionPlanWithFeatures } from '@/lib/types';

function BillingPageSkeleton() {
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <DashboardHeader />

          <Win95Window title="Billing & Usage" icon={<span>💳</span>}>
            <div className="space-y-4">
              {/* Header */}
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
                  <Win95Button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className={portalLoading ? 'win95-loading' : ''}
                  >
                    {portalLoading ? 'Loading...' : '💳 Manage Subscription'}
                  </Win95Button>
                )}
              </div>

              {/* Current Plan */}
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

                  {subscription?.cancel_at_period_end && (
                    <Win95Alert type="warning" title="Subscription Canceling">
                      Your subscription will end on{' '}
                      {subscription.current_period_end &&
                        new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                    </Win95Alert>
                  )}

                  {subscription?.status === 'past_due' && (
                    <Win95Alert type="error" title="Payment Failed">
                      Please update your payment method to continue your subscription
                    </Win95Alert>
                  )}

                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    {subscription?.current_period_end && (
                      <div className="win95-raised p-2">
                        <p className="text-[10px] text-[var(--win95-button-shadow)]">
                          📅 Next Billing Date
                        </p>
                        <p className="text-[11px] font-bold">
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
                    <div className="win95-raised p-2">
                      <p className="text-[10px] text-[var(--win95-button-shadow)]">
                        📊 Articles Limit
                      </p>
                      <p className="text-[11px] font-bold">
                        {planDetails.articles_per_month} per month
                      </p>
                    </div>
                  </div>

                  {planDetails.features.length > 0 && (
                    <div className="win95-sunken p-2">
                      <p className="text-[10px] font-bold mb-2">Features included:</p>
                      <ul className="grid md:grid-cols-2 gap-1">
                        {planDetails.features.map(feature => (
                          <li key={feature} className="flex items-start gap-1 text-[10px]">
                            <span className="text-[var(--win95-success)]">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </fieldset>
              </div>

              {/* Usage */}
              {usage && (
                <div className="win95-groupbox">
                  <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                    <legend className="win95-groupbox-title font-bold">⚡ Usage This Month</legend>

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

                    {!usage.can_generate && usage.plan === 'free' && (
                      <Win95Alert type="info" title="Upgrade to generate more">
                        Upgrade to Pro for 20 articles/month or Enterprise for 100 articles/month
                        <div className="mt-2">
                          <Link href="/pricing">
                            <Win95Button size="sm">View Plans →</Win95Button>
                          </Link>
                        </div>
                      </Win95Alert>
                    )}
                  </fieldset>
                </div>
              )}

              {/* Upgrade Options */}
              {usage?.plan === 'free' && (
                <div className="win95-groupbox">
                  <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                    <legend className="win95-groupbox-title font-bold">🚀 Upgrade Your Plan</legend>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="win95-raised p-3 text-center">
                        <h3 className="text-[12px] font-bold mb-1">Pro Plan</h3>
                        <p className="text-[20px] font-bold text-[var(--win95-title-bar)] mb-1">
                          $70/mo
                        </p>
                        <p className="text-[10px] text-[var(--win95-button-shadow)] mb-3">
                          20 articles per month
                        </p>
                        <Link href="/pricing">
                          <Win95Button className="w-full">Upgrade to Pro</Win95Button>
                        </Link>
                      </div>
                      <div className="win95-raised p-3 text-center">
                        <h3 className="text-[12px] font-bold mb-1">Enterprise Plan</h3>
                        <p className="text-[20px] font-bold text-[var(--win95-title-bar)] mb-1">
                          $299/mo
                        </p>
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

              {/* Back Link */}
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
