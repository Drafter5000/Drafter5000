import { getServerSupabaseSession, getServerSupabaseClient } from '@/lib/supabase-client';
import { getStripeClient } from '@/lib/stripe-client';
import { isSubscriptionExpired } from '@/lib/subscription-utils';
import { type NextRequest, NextResponse } from 'next/server';

// GET - Fetch current subscription details
// Requirements: 1.3, 5.5
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
      // Default to 'incomplete' if no subscription status is set
      // This ensures users without a subscription see the subscription required banner
      const status = profile?.subscription_status || 'incomplete';
      return NextResponse.json({
        plan: 'free',
        status,
        articles_used: 0,
        articles_limit: 2,
        is_expired: isSubscriptionExpired(status),
        expiration_date: null,
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
      // Default to 'incomplete' if no subscription status is set
      // This ensures users without a subscription see the subscription required banner
      const status = profile.subscription_status || 'incomplete';
      return NextResponse.json({
        plan: profile.subscription_plan || 'free',
        status,
        articles_used: 0,
        articles_limit: 2,
        is_expired: isSubscriptionExpired(status),
        expiration_date: null,
      });
    }

    // Determine the effective status
    // If database says expired (past_due/canceled), use that even if Stripe says active
    // This handles cases where webhook updated DB but Stripe hasn't synced yet
    const dbStatus = profile.subscription_status || 'incomplete';
    const stripeStatus = subscription.status;
    const dbIsExpired = isSubscriptionExpired(dbStatus);

    // Use database status if it indicates expired, otherwise use Stripe status
    const status = dbIsExpired ? dbStatus : stripeStatus || dbStatus;

    const expirationDate = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    return NextResponse.json({
      plan: profile.subscription_plan,
      status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at,
      is_expired: isSubscriptionExpired(status),
      expiration_date: expirationDate,
    });
  } catch (error: unknown) {
    console.error('Subscription fetch error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
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
  } catch (error: unknown) {
    console.error('Subscription cancel error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
