import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) return stripeClient;

  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });

  return stripeClient;
}

// Note: SUBSCRIPTION_PLANS constant has been removed.
// Plan data is now fetched dynamically from the database.
// Use getActivePlans() from lib/plan-utils.ts for plan data.
// Use getPlanByPriceId() or getPlanByPriceIdAdmin() for price ID mapping.
