import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) return stripeClient;

  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-15.acacia',
  });

  return stripeClient;
}

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    articles_per_month: 2,
    features: ['2 articles/month', 'Email delivery', 'Basic analytics'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 7000, // $70 in cents
    articles_per_month: 20,
    features: ['20 articles/month', 'Priority support', 'Advanced analytics', 'Custom scheduling'],
    stripe_product_id: process.env.STRIPE_PRODUCT_PRO_ID,
    stripe_price_id: process.env.STRIPE_PRICE_PRO_ID,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29900, // $299 in cents
    articles_per_month: 100,
    features: ['100 articles/month', 'Dedicated support', 'Team collaboration', 'Custom workflows'],
    stripe_product_id: process.env.STRIPE_PRODUCT_ENTERPRISE_ID,
    stripe_price_id: process.env.STRIPE_PRICE_ENTERPRISE_ID,
  },
};

export function getPlanFromPriceId(priceId: string): 'free' | 'pro' | 'enterprise' {
  if (priceId === process.env.STRIPE_PRICE_PRO_ID) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_ID) return 'enterprise';
  return 'free';
}
