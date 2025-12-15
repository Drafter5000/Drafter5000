import { getServerSupabaseClient } from './supabase-client';
import { getSupabaseAdmin } from './supabase-admin';
import { getArticlesLimitForPlan } from './plan-utils';
import type { UsageLimitResult, IncrementUsageResult } from './types';

/**
 * Check if user can generate articles based on their subscription usage.
 * Reads usage from the subscriptions table in the database.
 */
export async function checkUsageLimit(userId: string): Promise<UsageLimitResult> {
  const supabase = await getServerSupabaseClient();

  // Get user's current plan and subscription status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_plan, subscription_status')
    .eq('id', userId)
    .single();

  const plan = profile?.subscription_plan || 'free';
  const subscriptionStatus = profile?.subscription_status || 'trial';

  // Block if subscription is past_due or canceled
  if (subscriptionStatus === 'past_due' || subscriptionStatus === 'canceled') {
    return {
      canGenerate: false,
      articlesUsed: 0,
      articlesLimit: 0,
      plan,
      usageResetAt: null,
      periodEnd: null,
    };
  }

  // Get usage from subscriptions table
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('articles_used, articles_limit, usage_reset_at, current_period_end')
    .eq('user_id', userId)
    .single();

  // If no subscription record, get limit from plan and assume 0 usage
  if (!subscription) {
    const limit = await getArticlesLimitForPlan(plan);
    return {
      canGenerate: true,
      articlesUsed: 0,
      articlesLimit: limit,
      plan,
      usageResetAt: null,
      periodEnd: null,
    };
  }

  const used = subscription.articles_used || 0;
  const limit = subscription.articles_limit || (await getArticlesLimitForPlan(plan));

  return {
    canGenerate: used < limit,
    articlesUsed: used,
    articlesLimit: limit,
    plan,
    usageResetAt: subscription.usage_reset_at,
    periodEnd: subscription.current_period_end,
  };
}

/**
 * Check usage limit using admin client (for server-side operations without user context).
 */
export async function checkUsageLimitAdmin(userId: string): Promise<UsageLimitResult> {
  const supabase = getSupabaseAdmin();

  // Get user's current plan and subscription status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_plan, subscription_status')
    .eq('id', userId)
    .single();

  const plan = profile?.subscription_plan || 'free';
  const subscriptionStatus = profile?.subscription_status || 'trial';

  // Block if subscription is past_due or canceled
  if (subscriptionStatus === 'past_due' || subscriptionStatus === 'canceled') {
    return {
      canGenerate: false,
      articlesUsed: 0,
      articlesLimit: 0,
      plan,
      usageResetAt: null,
      periodEnd: null,
    };
  }

  // Get usage from subscriptions table
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('articles_used, articles_limit, usage_reset_at, current_period_end')
    .eq('user_id', userId)
    .single();

  // If no subscription record, get limit from plan and assume 0 usage
  if (!subscription) {
    const limit = await getArticlesLimitForPlanAdmin(plan);
    return {
      canGenerate: true,
      articlesUsed: 0,
      articlesLimit: limit,
      plan,
      usageResetAt: null,
      periodEnd: null,
    };
  }

  const used = subscription.articles_used || 0;
  const limit = subscription.articles_limit || (await getArticlesLimitForPlanAdmin(plan));

  return {
    canGenerate: used < limit,
    articlesUsed: used,
    articlesLimit: limit,
    plan,
    usageResetAt: subscription.usage_reset_at,
    periodEnd: subscription.current_period_end,
  };
}

/**
 * Get articles limit for a plan using admin client.
 */
async function getArticlesLimitForPlanAdmin(planId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('articles_per_month')
    .eq('id', planId)
    .single();

  return plan?.articles_per_month ?? 2; // Default to free tier limit
}

/**
 * Increment article usage for a user.
 * Returns the updated usage info and whether the user can still generate more articles.
 */
export async function incrementUsage(userId: string): Promise<IncrementUsageResult> {
  const supabase = getSupabaseAdmin();

  // Get current subscription
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('articles_used, articles_limit')
    .eq('user_id', userId)
    .single();

  if (fetchError || !subscription) {
    console.error('Failed to fetch subscription for usage increment:', fetchError);
    return {
      success: false,
      articlesUsed: 0,
      articlesLimit: 0,
      canGenerate: false,
    };
  }

  const currentUsed = subscription.articles_used || 0;
  const limit = subscription.articles_limit || 0;

  // Check if user has exceeded limit
  if (currentUsed >= limit) {
    return {
      success: false,
      articlesUsed: currentUsed,
      articlesLimit: limit,
      canGenerate: false,
    };
  }

  // Increment usage
  const newUsed = currentUsed + 1;
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      articles_used: newUsed,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to increment usage:', updateError);
    return {
      success: false,
      articlesUsed: currentUsed,
      articlesLimit: limit,
      canGenerate: currentUsed < limit,
    };
  }

  return {
    success: true,
    articlesUsed: newUsed,
    articlesLimit: limit,
    canGenerate: newUsed < limit,
  };
}

/**
 * Reset usage for a user (called at the start of a new billing period).
 */
export async function resetUsage(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('subscriptions')
    .update({
      articles_used: 0,
      usage_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to reset usage:', error);
    return false;
  }

  return true;
}

/**
 * Set the articles limit for a user's subscription.
 * Called when subscription is created or plan changes.
 */
export async function setUsageLimit(userId: string, limit: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('subscriptions')
    .update({
      articles_limit: limit,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to set usage limit:', error);
    return false;
  }

  return true;
}
