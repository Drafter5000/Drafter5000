import { getServerSupabaseClient } from '@/lib/supabase-client';
import { getStripeClient, SUBSCRIPTION_PLANS } from '@/lib/stripe-client';
import { getServerSupabaseSession } from '@/lib/supabase-client';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id } = await request.json();
    const plan = SUBSCRIPTION_PLANS[plan_id as keyof typeof SUBSCRIPTION_PLANS];

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
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

    // Get price ID for the plan
    const priceId =
      plan_id === 'pro' ? process.env.STRIPE_PRICE_PRO_ID : process.env.STRIPE_PRICE_ENTERPRISE_ID;

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 });
    }

    // Create checkout session
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
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
