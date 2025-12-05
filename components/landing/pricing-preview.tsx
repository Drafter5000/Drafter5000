'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { usePlans } from '@/hooks/use-plans';
import type { SubscriptionPlanWithFeatures } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';

const planIcons: Record<string, LucideIcon> = {
  free: Sparkles,
  starter: Sparkles,
  pro: Zap,
  enterprise: Crown,
};

function getPlanIcon(plan: SubscriptionPlanWithFeatures): LucideIcon {
  const id = plan.id.toLowerCase();
  if (planIcons[id]) return planIcons[id];
  if (plan.price_cents === 0) return Sparkles;
  if (plan.price_cents >= 9900) return Crown;
  return Zap;
}

function formatPrice(priceCents: number): string {
  if (priceCents === 0) return 'Free';
  return `$${(priceCents / 100).toFixed(0)}`;
}

function getCtaText(plan: SubscriptionPlanWithFeatures): string {
  if (plan.cta_text) return plan.cta_text;
  if (plan.price_cents === 0) return 'Get Started';
  if (plan.cta_type === 'email') return 'Contact Sales';
  return 'Start Free Trial';
}

function getCtaHref(plan: SubscriptionPlanWithFeatures): string {
  if (plan.cta_type === 'email') return '/pricing';
  return '/signup';
}

function PlanCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="h-full p-8 rounded-3xl border bg-card border-border">
        <Skeleton className="h-12 w-12 rounded-2xl mb-6" />
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-4 w-40 mb-6" />
        <Skeleton className="h-10 w-20 mb-8" />
        <div className="space-y-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </motion.div>
  );
}

export function PricingPreview() {
  const { plans, loading } = usePlans();

  const gridClass =
    loading || plans.length === 0
      ? 'md:grid-cols-3'
      : plans.length === 1
        ? 'grid-cols-1 max-w-sm'
        : plans.length === 2
          ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
          : 'md:grid-cols-3';

  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-chart-2/5 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chart-5/10 text-chart-5 text-sm font-medium mb-6">
            <Crown className="h-4 w-4" />
            Pricing Plans
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, transparent{' '}
            <span className="bg-gradient-to-r from-chart-5 to-chart-4 bg-clip-text text-transparent">
              pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </motion.div>

        <div className={`grid gap-8 max-w-5xl mx-auto ${gridClass}`}>
          {loading ? (
            <>
              <PlanCardSkeleton index={0} />
              <PlanCardSkeleton index={1} />
              <PlanCardSkeleton index={2} />
            </>
          ) : (
            plans.map((plan, index) => {
              const Icon = getPlanIcon(plan);
              const isPopular = plan.is_highlighted;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative ${isPopular ? 'lg:-mt-4 lg:mb-4' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-chart-2 text-white text-sm font-medium shadow-lg">
                      Most Popular
                    </div>
                  )}
                  <div
                    className={`h-full p-8 rounded-3xl border transition-all duration-300 ${
                      isPopular
                        ? 'bg-gradient-to-b from-primary/5 to-card border-primary/30 shadow-2xl shadow-primary/10'
                        : 'bg-card border-border hover:border-primary/20'
                    }`}
                  >
                    <div
                      className={`inline-flex p-3 rounded-2xl mb-6 ${
                        isPopular ? 'bg-primary/10' : 'bg-secondary'
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    </div>

                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground mb-6">{plan.description}</p>

                    <div className="mb-8">
                      <span className="text-4xl font-bold">{formatPrice(plan.price_cents)}</span>
                      {plan.price_cents > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map(feature => (
                        <li key={feature.id} className="flex items-center gap-3">
                          <Check
                            className={`h-5 w-5 shrink-0 ${isPopular ? 'text-primary' : 'text-chart-4'}`}
                          />
                          <span className="text-muted-foreground">{feature.feature_text}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href={getCtaHref(plan)} className="block">
                      <Button
                        className={`w-full h-12 ${
                          isPopular
                            ? 'shadow-lg shadow-primary/25'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                        variant={isPopular ? 'default' : 'secondary'}
                      >
                        {getCtaText(plan)}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
