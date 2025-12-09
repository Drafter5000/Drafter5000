'use client';

import { Win95Window, Win95Button, Win95Alert, Win95Badge } from '@/components/win95';
import { DashboardHeader } from '@/components/dashboard-header';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/components/auth-provider';
import { usePlans } from '@/hooks/use-plans';
import type { SubscriptionPlanWithFeatures } from '@/lib/types';
import Link from 'next/link';

function PlanCardSkeleton() {
  return (
    <div className="win95-raised p-3">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-[var(--win95-bg-dark)] w-24"></div>
        <div className="h-3 bg-[var(--win95-bg-dark)] w-32"></div>
        <div className="h-6 bg-[var(--win95-bg-dark)] w-20 mt-4"></div>
        <div className="space-y-2 mt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-3 bg-[var(--win95-bg-dark)] w-full"></div>
          ))}
        </div>
        <div className="h-6 bg-[var(--win95-bg-dark)] w-full mt-4"></div>
      </div>
    </div>
  );
}

function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(0)}`;
}

function getCtaText(plan: SubscriptionPlanWithFeatures): string {
  if (plan.cta_text) return plan.cta_text;
  if (plan.price_cents === 0) return 'Get Started';
  if (plan.cta_type === 'email') return 'Contact Sales';
  return 'Subscribe Now';
}

export default function PricingPage() {
  const { user } = useAuth();
  const { plans, loading, error } = usePlans();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: SubscriptionPlanWithFeatures) => {
    if (plan.cta_type === 'email') {
      window.location.href = 'mailto:sales@drafter.com';
      return;
    }

    if (plan.cta_type === 'signup' || plan.price_cents === 0) {
      window.location.href = user ? '/dashboard' : '/articles/generate/step-1';
      return;
    }

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
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        {user && <DashboardHeader />}

        {!user && (
          <div className="win95-raised p-1 mb-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-[16px]">🏠</span>
                <span className="text-[12px] font-bold">Drafter</span>
              </Link>
              <div className="flex items-center gap-1">
                <Link href="/articles/generate/step-1">
                  <Win95Button size="sm">✨ Get Started</Win95Button>
                </Link>
                <Link href="/login">
                  <Win95Button size="sm">🔐 Log In</Win95Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <Win95Window title="Pricing - Drafter" icon={<span>💰</span>}>
          <div className="space-y-4">
            {/* Header */}
            <div className="win95-sunken p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[20px]">💰</span>
                <h1 className="text-[14px] font-bold">Plans for Every Creator</h1>
              </div>
              <p className="text-[11px] text-[var(--win95-button-shadow)] mt-1">
                Start free and upgrade anytime. No credit card required.
              </p>
            </div>

            {error && (
              <Win95Alert type="error" title="Error">
                {error}
              </Win95Alert>
            )}

            {/* Plans Grid */}
            <div
              className={`grid gap-4 ${
                !loading && plans.length === 1
                  ? 'grid-cols-1 max-w-[280px] mx-auto'
                  : !loading && plans.length === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : !loading && plans.length === 4
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
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
                  <div
                    key={plan.id}
                    className={`win95-raised p-3 flex flex-col ${
                      plan.is_highlighted ? 'ring-2 ring-[var(--win95-title-bar)]' : ''
                    }`}
                  >
                    {plan.is_highlighted && (
                      <div className="text-center mb-2">
                        <Win95Badge variant="default">⭐ Most Popular</Win95Badge>
                      </div>
                    )}

                    <div className="win95-sunken p-2 mb-3">
                      <h2 className="text-[12px] font-bold">{plan.name}</h2>
                      <p className="text-[10px] text-[var(--win95-button-shadow)]">
                        {plan.description}
                      </p>
                    </div>

                    <div className="text-center mb-3">
                      <span className="text-[24px] font-bold text-[var(--win95-title-bar)]">
                        {formatPrice(plan.price_cents)}
                      </span>
                      <span className="text-[11px]"> / month</span>
                      <p className="text-[10px] text-[var(--win95-button-shadow)] mt-1">
                        {plan.articles_per_month} articles per month
                      </p>
                    </div>

                    <div className="win95-sunken p-2 flex-1 mb-3">
                      <p className="text-[10px] font-bold mb-2">Features:</p>
                      <ul className="space-y-1">
                        {plan.features.map(feature => (
                          <li key={feature.id} className="flex items-start gap-1 text-[10px]">
                            <span className="text-[var(--win95-success)]">✓</span>
                            <span>{feature.feature_text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Win95Button
                      onClick={() => handleCheckout(plan)}
                      disabled={checkoutLoading === plan.id}
                      className={`w-full ${checkoutLoading === plan.id ? 'win95-loading' : ''}`}
                    >
                      {checkoutLoading === plan.id ? 'Processing...' : getCtaText(plan)}
                    </Win95Button>
                  </div>
                ))
              )}
            </div>

            {/* Guarantees */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="win95-groupbox">
                <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                  <legend className="win95-groupbox-title font-bold">🔄 Cancel Anytime</legend>
                  <p className="text-[10px]">
                    No long-term commitments. Cancel your subscription anytime with just a few
                    clicks.
                  </p>
                </fieldset>
              </div>
              <div className="win95-groupbox">
                <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                  <legend className="win95-groupbox-title font-bold">
                    💯 Money-Back Guarantee
                  </legend>
                  <p className="text-[10px]">
                    30-day guarantee. If you're not happy, we'll refund you completely.
                  </p>
                </fieldset>
              </div>
            </div>

            {/* Back Link */}
            <div className="text-center pt-2">
              <Link href="/">
                <Win95Button size="sm">← Back to Home</Win95Button>
              </Link>
            </div>
          </div>
        </Win95Window>
      </div>
    </div>
  );
}
