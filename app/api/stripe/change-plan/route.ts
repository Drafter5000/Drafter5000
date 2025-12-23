import { getServerSupabaseSession, getServerSupabaseClient } from '@/lib/supabase-client';
import { getStripeClient } from '@/lib/stripe-client';
import { getPlanById } from '@/lib/plan-utils';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { type NextRequest, NextResponse } from 'next/server';

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
    const existingProducts = await stripe.products.search({
      query: `metadata['plan_id']:'${plan.id}'`,
    });

    if (existingProducts.data.length > 0) {
      productId = existingProducts.data[0].id;
    } else {
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description || undefined,
        metadata: { plan_id: plan.id },
      });
      productId = product.id;
    }

    await supabaseAdmin
      .from('subscription_plans')
      .update({ stripe_product_id: productId })
      .eq('id', plan.id);
  }

  // Create or retrieve Stripe price
  if (!priceId) {
    const existingPrices = await stripe.prices.list({
      product: productId,
      active: true,
      type: 'recurring',
    });

    const matchingPrice = existingPrices.data.find(
      p =>
        p.unit_amount === plan.price_cents &&
        p.currency.toLowerCase() === plan.currency.toLowerCase()
    );

    if (matchingPrice) {
      priceId = matchingPrice.id;
    } else {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: plan.price_cents,
        currency: plan.currency.toLowerCase(),
        recurring: { interval: 'month' },
        metadata: { plan_id: plan.id },
      });
      priceId = price.id;
    }

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

    const { new_plan_id } = await request.json();

    if (!new_plan_id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Fetch plan from database to get the latest pricing
    const plan = await getPlanById(new_plan_id);

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Free plans don't need subscription change
    if (plan.price_cents === 0) {
      return NextResponse.json(
        { error: 'Cannot change to free plan via this endpoint' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const supabase = await getServerSupabaseClient();

    // Get current subscription
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', session.user.id)
      .single();

    if (!subscriptionData?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
    }

    // Ensure Stripe product and price exist (auto-create if needed)
    const { priceId } = await ensureStripeProductAndPrice(plan);

    // Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      subscriptionData.stripe_subscription_id
    );

    // Update subscription with new price from database
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: 'create_prorations',
      metadata: {
        plan_id: new_plan_id,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
    });
  } catch (error: unknown) {
    console.error('Plan change error:', error);
    const message = error instanceof Error ? error.message : 'Failed to change plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
