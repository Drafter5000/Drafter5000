import { getServerSupabaseSession, getServerSupabaseClient } from '@/lib/supabase-client';
import { getStripeClient } from '@/lib/stripe-client';
import { type NextRequest, NextResponse } from 'next/server';

// GET - Fetch current subscription details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getServerSupabaseClient();
    const stripe = getStripeClient();

    // Get user profile with subscription info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*, subscriptions(*)')
      .eq('id', session.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({
        plan: 'free',
        status: 'active',
        articles_used: 0,
        articles_limit: 2,
      });
    }

    // Get subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 1,
    });

    const subscription = subscriptions.data[0];

    if (!subscription) {
      return NextResponse.json({
        plan: profile.subscription_plan || 'free',
        status: profile.subscription_status || 'active',
        articles_used: 0,
        articles_limit: 2,
      });
    }

    return NextResponse.json({
      plan: profile.subscription_plan,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at,
    });
  } catch (error: any) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getServerSupabaseClient();
    const stripe = getStripeClient();

    // Get subscription ID
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', session.user.id)
      .single();

    if (!subscriptionData?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(
      subscriptionData.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    return NextResponse.json({
      success: true,
      cancel_at: subscription.cancel_at,
    });
  } catch (error: any) {
    console.error('Subscription cancel error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
