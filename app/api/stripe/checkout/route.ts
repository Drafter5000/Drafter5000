import { getServerSupabaseClient } from '@/lib/supabase-client';
import { getStripeClient } from '@/lib/stripe-client';
import { getServerSupabaseSession } from '@/lib/supabase-client';
import { getPlanById } from '@/lib/plan-utils';
import { type NextRequest, NextResponse } from 'next/server';

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

    const { plan_id } = body;

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

    // Ensure stripe_price_id is configured
    if (!plan.stripe_price_id) {
      return NextResponse.json({ error: 'Plan not configured for checkout' }, { status: 400 });
    }

    const stripe = getStripeClient();
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

    // Create checkout session using database price ID
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: plan_id === 'pro' ? 7 : 0, // 7-day trial for Pro
        metadata: {
          user_id: session.user.id,
          plan_id,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/pricing`,
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
