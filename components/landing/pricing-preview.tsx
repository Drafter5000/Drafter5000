'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for trying out Drafter',
    icon: Sparkles,
    features: ['5 articles per month', 'Basic style learning', 'Email delivery', 'Standard topics'],
    cta: 'Get Started',
    href: '/onboarding/step-1',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For serious content creators',
    icon: Zap,
    features: [
      '50 articles per month',
      'Advanced style learning',
      'Priority delivery',
      'Custom topics',
      'SEO optimization',
      'Multiple writing styles',
    ],
    cta: 'Start Free Trial',
    href: '/onboarding/step-1',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For teams and agencies',
    icon: Crown,
    features: [
      'Unlimited articles',
      'Team collaboration',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    href: '/pricing',
    popular: false,
  },
];

export function PricingPreview() {
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

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-chart-2 text-white text-sm font-medium shadow-lg">
                  Most Popular
                </div>
              )}
              <div
                className={`h-full p-8 rounded-3xl border transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-primary/5 to-card border-primary/30 shadow-2xl shadow-primary/10'
                    : 'bg-card border-border hover:border-primary/20'
                }`}
              >
                <div
                  className={`inline-flex p-3 rounded-2xl mb-6 ${
                    plan.popular ? 'bg-primary/10' : 'bg-secondary'
                  }`}
                >
                  <plan.icon
                    className={`h-6 w-6 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                </div>

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-6">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check
                        className={`h-5 w-5 ${plan.popular ? 'text-primary' : 'text-chart-4'}`}
                      />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} className="block">
                  <Button
                    className={`w-full h-12 ${
                      plan.popular
                        ? 'shadow-lg shadow-primary/25'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                    variant={plan.popular ? 'default' : 'secondary'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
