'use server';

import { getServerSupabaseClient } from '@/lib/supabase-client';
import { getStripeClient, SUBSCRIPTION_PLANS } from '@/lib/stripe-client';
import type { UserProfile } from '@/lib/types';

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
        trial_period_days: 7, // Default 7-day trial for all paid plans
        metadata: {
          user_id: userId,
          plan_id: planId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL}/pricing`,
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
    const supabase = await getServerSupabaseClient();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    const plan = profile?.subscription_plan || 'free';
    const planDetails = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: articlesUsed } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    return {
      plan,
      articles_used: articlesUsed || 0,
      articles_limit: planDetails.articles_per_month,
      percentage_used: Math.round(((articlesUsed || 0) / planDetails.articles_per_month) * 100),
      can_generate: (articlesUsed || 0) < planDetails.articles_per_month,
    };
  } catch (error) {
    console.error('[Billing] Usage stats error:', error);
    throw error;
  }
}
