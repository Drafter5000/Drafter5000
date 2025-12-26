import { getServerSupabaseUser } from '@/lib/supabase-client';
import { getStripeClient } from '@/lib/stripe-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getPlanByPriceIdAdmin } from '@/lib/plan-utils';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST - Verify a Stripe checkout session and update subscription status
 * This is used as a fallback when the webhook hasn't processed yet
 * Uses getUser() for secure authentication instead of getSession().
 */
export async function POST(request: NextRequest) {
  try {
    // Use getUser() for secure authentication (validates token with Supabase Auth server)
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const supabaseAdmin = getSupabaseAdmin();

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription'],
    });

    // Verify the session belongs to this user
    if (checkoutSession.metadata?.user_id !== user.id) {
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 });
    }

    // Check if payment was successful
    if (
      checkoutSession.payment_status !== 'paid' &&
      checkoutSession.payment_status !== 'no_payment_required'
    ) {
      return NextResponse.json({
        success: false,
        status: 'pending',
        message: 'Payment not completed',
      });
    }

    const subscription = checkoutSession.subscription as any;

    if (!subscription) {
      return NextResponse.json({
        success: false,
        status: 'pending',
        message: 'No subscription found',
      });
    }

    // Get subscription details
    const stripeSubscriptionStatus = subscription.status;
    const priceId = subscription.items?.data?.[0]?.price?.id;

    console.log('[VerifySession] Stripe subscription status:', stripeSubscriptionStatus);
    console.log('[VerifySession] Price ID:', priceId);

    // For paid subscriptions, we consider them active even if Stripe says 'trialing' or similar
    // Since we don't have trials, a paid checkout means active subscription
    const subscriptionStatus =
      stripeSubscriptionStatus === 'active' || stripeSubscriptionStatus === 'trialing'
        ? 'active'
        : stripeSubscriptionStatus || 'active';

    console.log('[VerifySession] Final subscription status to save:', subscriptionStatus);

    // Get plan from metadata or lookup by price
    let plan = checkoutSession.metadata?.plan_id;
    if (!plan && priceId) {
      const planData = await getPlanByPriceIdAdmin(priceId);
      plan = planData?.id || 'pro';
    }

    console.log('[VerifySession] Plan:', plan);
    console.log('[VerifySession] User ID:', user.id);

    // Update user profile with subscription status
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_status: subscriptionStatus,
        subscription_plan: plan,
        stripe_customer_id: checkoutSession.customer as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select();

    console.log('[VerifySession] Update result:', updateData);

    if (updateError) {
      console.error('[VerifySession] Failed to update profile:', updateError);
      return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 });
    }

    console.log('[VerifySession] Profile updated successfully');

    // Also update/create subscription record
    const periodStart = subscription.current_period_start || Math.floor(Date.now() / 1000);
    const periodEnd =
      subscription.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    await supabaseAdmin.from('subscriptions').upsert({
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId || '',
      plan: plan || 'pro',
      status: subscriptionStatus,
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      status: subscriptionStatus,
      plan,
    });
  } catch (error: unknown) {
    console.error('Verify session error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
