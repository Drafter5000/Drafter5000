import { getServerSupabaseClient } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { SubscriptionPlan, PlanFeature, SubscriptionPlanWithFeatures } from '@/lib/types';

/**
 * Fetches all active and visible subscription plans with their features from the database.
 * Plans are sorted by sort_order ascending.
 * Features within each plan are sorted by sort_order ascending.
 * @param includeHidden - If true, includes plans with is_visible=false (for admin use)
 */
export async function getActivePlans(
  includeHidden: boolean = false
): Promise<SubscriptionPlanWithFeatures[]> {
  const supabase = await getServerSupabaseClient();

  // Build query for active plans
  let query = supabase.from('subscription_plans').select('*').eq('is_active', true);

  // Filter by visibility unless includeHidden is true
  if (!includeHidden) {
    query = query.eq('is_visible', true);
  }

  // Fetch plans ordered by sort_order
  const { data: plans, error: plansError } = await query.order('sort_order', { ascending: true });

  if (plansError) {
    console.error('Error fetching plans:', plansError);
    throw new Error('Failed to fetch subscription plans');
  }

  if (!plans || plans.length === 0) {
    return [];
  }

  // Fetch all features for the active plans
  const planIds = plans.map(p => p.id);
  const { data: features, error: featuresError } = await supabase
    .from('plan_features')
    .select('*')
    .in('plan_id', planIds)
    .order('sort_order', { ascending: true });

  if (featuresError) {
    console.error('Error fetching features:', featuresError);
    throw new Error('Failed to fetch plan features');
  }

  // Map features to their respective plans
  const plansWithFeatures: SubscriptionPlanWithFeatures[] = plans.map(plan => ({
    ...plan,
    features: (features || []).filter(f => f.plan_id === plan.id),
  }));

  return plansWithFeatures;
}

/**
 * Fetches a single subscription plan by ID with its features.
 */
export async function getPlanById(id: string): Promise<SubscriptionPlanWithFeatures | null> {
  const supabase = await getServerSupabaseClient();

  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (planError || !plan) {
    return null;
  }

  const { data: features, error: featuresError } = await supabase
    .from('plan_features')
    .select('*')
    .eq('plan_id', id)
    .order('sort_order', { ascending: true });

  if (featuresError) {
    console.error('Error fetching features for plan:', featuresError);
  }

  return {
    ...plan,
    features: features || [],
  };
}

/**
 * Fetches a subscription plan by its Stripe price ID.
 * Used for webhook handling to map Stripe events to internal plans.
 */
export async function getPlanByPriceId(priceId: string): Promise<SubscriptionPlan | null> {
  const supabase = await getServerSupabaseClient();

  const { data: plan, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();

  if (error || !plan) {
    return null;
  }

  return plan;
}

/**
 * Fetches a subscription plan by its Stripe price ID using admin client.
 * Used for webhook handling where there's no authenticated user context.
 */
export function getPlanByPriceIdAdmin(priceId: string): Promise<SubscriptionPlan | null> {
  const supabase = getSupabaseAdmin();

  return supabase
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single()
    .then(({ data, error }) => {
      if (error || !data) {
        return null;
      }
      return data as SubscriptionPlan;
    });
}

/**
 * Gets the articles per month limit for a given plan ID.
 * Returns default free tier limit if plan not found.
 */
export async function getArticlesLimitForPlan(planId: string): Promise<number> {
  const plan = await getPlanById(planId);
  return plan?.articles_per_month ?? 2; // Default to free tier limit
}
