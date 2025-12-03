'use client'

import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap } from 'lucide-react'
import { useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/components/auth-provider'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    articles_per_month: 2,
    features: [
      '2 articles per month',
      'Email delivery',
      'AI style learning',
      'Basic scheduling',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 70,
    description: 'Most popular for creators',
    articles_per_month: 20,
    features: [
      '20 articles per month',
      'Priority email delivery',
      'Advanced AI customization',
      'Flexible scheduling',
      'Priority support',
      'Analytics dashboard',
      'Custom tone control',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    description: 'For teams and agencies',
    articles_per_month: 100,
    features: [
      '100 articles per month',
      'Instant delivery',
      'White-label option',
      'Team collaboration',
      '24/7 dedicated support',
      'Advanced analytics',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (planId: string) => {
    if (!user) {
      // Redirect to login/signup
      window.location.href = '/signup'
      return
    }

    setLoading(planId)
    try {
      const { sessionUrl } = await apiClient.post<{ sessionUrl: string }>('/stripe/checkout', {
        plan_id: planId,
      })
      window.location.href = sessionUrl
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(null)
    }
  }

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

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PLANS.map(plan => (
              <Card
                key={plan.id}
                className={`border-2 relative flex flex-col transition-all hover:shadow-lg ${
                  plan.highlighted
                    ? 'border-primary/50 shadow-xl shadow-primary/10 md:scale-105 md:z-10'
                    : 'border-border'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className={plan.highlighted ? 'pt-8' : ''}>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground"> / month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    {plan.articles_per_month} articles per month
                  </p>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="space-y-4">
                    {plan.features.map(feature => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  {plan.id === 'enterprise' ? (
                    <a href="mailto:sales@drafter.com" className="w-full">
                      <Button
                        variant={plan.highlighted ? 'default' : 'outline'}
                        className="w-full gap-2 shadow-lg shadow-primary/20"
                      >
                        {plan.cta}
                      </Button>
                    </a>
                  ) : (
                    <Button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={loading === plan.id}
                      variant={plan.highlighted ? 'default' : 'outline'}
                      className="w-full gap-2 shadow-lg shadow-primary/20"
                    >
                      {loading === plan.id ? 'Processing...' : plan.cta}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
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
  )
}
