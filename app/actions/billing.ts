'use server';

import { getStripeClient } from '@/lib/stripe-client';
import { getServerSupabaseClient } from '@/lib/supabase-client';
import type { UserProfile } from '@/lib/types';
import { checkUsageLimit } from '@/lib/usage-limits';

export async function createCheckoutSession(userId: string, planId: 'pro' | 'enterprise') {
  try {
    const supabase = await getServerSupabaseClient();
    const stripe = getStripeClient();

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) throw new Error('User profile not found');

    const priceMap = {
      pro: process.env.STRIPE_PRICE_PRO_ID,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE_ID,
    };

    const priceId = priceMap[planId];
    if (!priceId) throw new Error('Price ID not configured');

    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_id: planId,
        },
      },
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL}/dashboard?payment_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL}/subscribe`,
      metadata: {
        user_id: userId,
        plan_id: planId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('[Billing] Checkout creation error:', error);
    throw error;
  }
}

export async function getSubscriptionStatus(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return profile as UserProfile;
  } catch (error) {
    console.error('[Billing] Status check error:', error);
    return null;
  }
}

export async function cancelSubscription(userId: string) {
  try {
    const supabase = await getServerSupabaseClient();
    const stripe = getStripeClient();

    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (!subscriptionData?.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    const subscription = await stripe.subscriptions.update(
      subscriptionData.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    return {
      success: true,
      cancel_at: subscription.cancel_at,
    };
  } catch (error) {
    console.error('[Billing] Cancel error:', error);
    throw error;
  }
}

export async function reactivateSubscription(userId: string) {
  try {
    const supabase = await getServerSupabaseClient();
    const stripe = getStripeClient();

    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (!subscriptionData?.stripe_subscription_id) {
      throw new Error('No subscription found');
    }

    const subscription = await stripe.subscriptions.update(
      subscriptionData.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    );

    return {
      success: true,
      subscription,
    };
  } catch (error) {
    console.error('[Billing] Reactivate error:', error);
    throw error;
  }
}

export async function getUsageStats(userId: string) {
  try {
    // Get usage from database
    const usage = await checkUsageLimit(userId);

    return {
      plan: usage.plan,
      articles_used: usage.articlesUsed,
      articles_limit: usage.articlesLimit,
      percentage_used:
        usage.articlesLimit > 0 ? Math.round((usage.articlesUsed / usage.articlesLimit) * 100) : 0,
      can_generate: usage.canGenerate,
      usage_reset_at: usage.usageResetAt,
      period_end: usage.periodEnd,
    };
  } catch (error) {
    console.error('[Billing] Usage stats error:', error);
    throw error;
  }
}
