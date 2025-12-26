import { getSupabaseAdmin } from '../supabase-admin';
import { getPlanByIdAdmin, getActivePlansAdmin } from '../plan-utils';

export interface BillingStatus {
  organization_id: string;
  organization_name: string;
  subscription_status: string;
  plan_name: string;
  billing_cycle: 'monthly' | 'yearly' | 'none';
  next_billing_date: string | null;
  amount_cents: number;
  currency: string;
  member_count: number;
}

export interface PlatformBillingOverview {
  total_organizations: number;
  active_subscriptions: number;
  total_revenue_cents: number;
  subscriptions_by_status: Record<string, number>;
  subscriptions_by_plan: Record<string, number>;
}

/**
 * Gets billing status for a specific organization
 */
export async function getBillingStatus(orgId: string): Promise<BillingStatus | null> {
  const supabase = getSupabaseAdmin();

  // Get organization details
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    return null;
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('is_active', true);

  // Get subscription info from users in the organization
  // For now, we aggregate from user_profiles - in a real app this would come from Stripe
  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const userIds = members?.map(m => m.user_id) || [];

  let subscriptionStatus = 'none';
  let planName = 'Free';
  let amountCents = 0;
  let currency = 'USD';

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('subscription_status, subscription_plan')
      .in('id', userIds)
      .not('subscription_status', 'eq', 'incomplete');

    if (profiles && profiles.length > 0) {
      // Get the highest tier subscription
      const activeProfile = profiles.find(p => p.subscription_status === 'active');
      if (activeProfile) {
        subscriptionStatus = activeProfile.subscription_status;
        planName = activeProfile.subscription_plan;

        // Fetch actual plan pricing from database
        const plan = await getPlanByIdAdmin(planName);
        if (plan) {
          amountCents = plan.price_cents;
          currency = plan.currency.toUpperCase();
        }
      }
    }
  }

  return {
    organization_id: org.id,
    organization_name: org.name,
    subscription_status: subscriptionStatus,
    plan_name: planName,
    billing_cycle: amountCents > 0 ? 'monthly' : 'none',
    next_billing_date: null, // Would come from Stripe
    amount_cents: amountCents,
    currency: currency,
    member_count: memberCount || 0,
  };
}

/**
 * Gets platform-wide billing overview (Super Admin only)
 */
export async function getPlatformBillingOverview(): Promise<PlatformBillingOverview> {
  const supabase = getSupabaseAdmin();

  // Get total organizations
  const { count: totalOrgs } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  // Fetch all active plans to build a pricing lookup map
  const plans = await getActivePlansAdmin();
  const planPriceMap: Record<string, number> = {};
  plans.forEach(plan => {
    planPriceMap[plan.id] = plan.price_cents;
  });

  // Get subscription stats from user_profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('subscription_status, subscription_plan');

  const subscriptionsByStatus: Record<string, number> = {};
  const subscriptionsByPlan: Record<string, number> = {};
  let activeSubscriptions = 0;
  let totalRevenueCents = 0;

  (profiles || []).forEach(profile => {
    // Count by status
    const status = profile.subscription_status || 'unknown';
    subscriptionsByStatus[status] = (subscriptionsByStatus[status] || 0) + 1;

    // Count by plan
    const plan = profile.subscription_plan || 'free';
    subscriptionsByPlan[plan] = (subscriptionsByPlan[plan] || 0) + 1;

    // Count active and calculate revenue using actual plan pricing
    if (profile.subscription_status === 'active') {
      activeSubscriptions++;
      totalRevenueCents += planPriceMap[plan] || 0;
    }
  });

  return {
    total_organizations: totalOrgs || 0,
    active_subscriptions: activeSubscriptions,
    total_revenue_cents: totalRevenueCents,
    subscriptions_by_status: subscriptionsByStatus,
    subscriptions_by_plan: subscriptionsByPlan,
  };
}
