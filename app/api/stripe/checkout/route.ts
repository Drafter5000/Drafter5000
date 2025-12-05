import { getServerSupabaseClient } from '@/lib/supabase-client';
import { getStripeClient } from '@/lib/stripe-client';
import { getServerSupabaseSession } from '@/lib/supabase-client';
import { getPlanById } from '@/lib/plan-utils';
import { type NextRequest, NextResponse } from 'next/server';

// Default trial period in days
const DEFAULT_TRIAL_DAYS = 7;

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

    // Determine trial period - use provided trial_days or default
    const trialPeriodDays = typeof trial_days === 'number' ? trial_days : DEFAULT_TRIAL_DAYS;

    // Determine URLs - use provided URLs or defaults
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL ||
      'http://localhost:3000';
    const finalSuccessUrl =
      success_url || `${baseUrl}/onboarding/step-1?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancel_url || `${baseUrl}/subscribe`;

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
