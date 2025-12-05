import { getServerSupabaseClient } from '@/lib/supabase-client';
import { getStripeClient } from '@/lib/stripe-client';
import { getServerSupabaseSession } from '@/lib/supabase-client';
import { getPlanById } from '@/lib/plan-utils';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { type NextRequest, NextResponse } from 'next/server';

// Default trial period in days
const DEFAULT_TRIAL_DAYS = 7;

/**
 * Ensures a Stripe product and price exist for the given plan.
 * Creates them if they don't exist and updates the database.
 */
async function ensureStripeProductAndPrice(plan: {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
}): Promise<{ productId: string; priceId: string }> {
  const stripe = getStripeClient();
  const supabaseAdmin = getSupabaseAdmin();

  let productId = plan.stripe_product_id;
  let priceId = plan.stripe_price_id;

  // Create or retrieve Stripe product
  if (!productId) {
    // Check if product already exists in Stripe by metadata
    const existingProducts = await stripe.products.search({
      query: `metadata['plan_id']:'${plan.id}'`,
    });

    if (existingProducts.data.length > 0) {
      productId = existingProducts.data[0].id;
    } else {
      // Create new product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description || undefined,
        metadata: {
          plan_id: plan.id,
        },
      });
      productId = product.id;
    }

    // Update database with product ID
    await supabaseAdmin
      .from('subscription_plans')
      .update({ stripe_product_id: productId })
      .eq('id', plan.id);
  }

  // Create or retrieve Stripe price
  if (!priceId) {
    // Check if price already exists for this product
    const existingPrices = await stripe.prices.list({
      product: productId,
      active: true,
      type: 'recurring',
    });

    // Find a matching price (same amount and currency)
    const matchingPrice = existingPrices.data.find(
      p =>
        p.unit_amount === plan.price_cents &&
        p.currency.toLowerCase() === plan.currency.toLowerCase()
    );

    if (matchingPrice) {
      priceId = matchingPrice.id;
    } else {
      // Create new price
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: plan.price_cents,
        currency: plan.currency.toLowerCase(),
        recurring: {
          interval: 'month',
        },
        metadata: {
          plan_id: plan.id,
        },
      });
      priceId = price.id;
    }

    // Update database with price ID
    await supabaseAdmin
      .from('subscription_plans')
      .update({ stripe_price_id: priceId })
      .eq('id', plan.id);
  }

  return { productId, priceId };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { plan_id, trial_days, success_url, cancel_url } = body;

    if (!plan_id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Fetch plan from database
    const plan = await getPlanById(plan_id);

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Free plans don't need checkout
    if (plan.price_cents === 0) {
      return NextResponse.json({ error: 'Free plan does not require checkout' }, { status: 400 });
    }

    const stripe = getStripeClient();

    // Ensure Stripe product and price exist (auto-create if needed)
    const { priceId } = await ensureStripeProductAndPrice(plan);
    const supabase = await getServerSupabaseClient();

    // Get or create Stripe customer
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();

    let customerId = profileData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { user_id: session.user.id },
      });
      customerId = customer.id;

      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', session.user.id);
    }

    // Determine trial period - use provided trial_days or default
    const trialPeriodDays = typeof trial_days === 'number' ? trial_days : DEFAULT_TRIAL_DAYS;

    // Determine URLs - use provided URLs or defaults
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL ||
      'http://localhost:3000';
    const finalSuccessUrl = success_url || `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancel_url || `${baseUrl}/subscribe`;

    // Create checkout session using the resolved price ID
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialPeriodDays,
        metadata: {
          user_id: session.user.id,
          plan_id,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        user_id: session.user.id,
        plan_id,
      },
    });

    return NextResponse.json({ sessionUrl: checkoutSession.url });
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
