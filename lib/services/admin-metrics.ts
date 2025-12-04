import { getSupabaseAdmin } from '../supabase-admin';
import type { DashboardMetrics, UserProfile } from '../types';

/**
 * Gets dashboard metrics for admin overview
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = getSupabaseAdmin();

  // Get total users count
  const { count: totalUsers } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });

  // Get total organizations count
  const { count: totalOrganizations } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Get subscriptions by plan
  const { data: subscriptionData } = await supabase
    .from('user_profiles')
    .select('subscription_plan');

  const subscriptionsByPlan: Record<string, number> = {};
  if (subscriptionData) {
    subscriptionData.forEach(user => {
      const plan = user.subscription_plan || 'free';
      subscriptionsByPlan[plan] = (subscriptionsByPlan[plan] || 0) + 1;
    });
  }

  // Get recent registrations (past 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentRegistrations } = await supabase
    .from('user_profiles')
    .select('*')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  // Get active users (users with active subscription status)
  const { count: activeUsers } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .in('subscription_status', ['active', 'trial']);

  return {
    total_users: totalUsers || 0,
    total_organizations: totalOrganizations || 0,
    subscriptions_by_plan: subscriptionsByPlan,
    recent_registrations: (recentRegistrations as UserProfile[]) || [],
    active_users: activeUsers || 0,
  };
}

/**
 * Gets user growth data for charts
 */
export async function getUserGrowthData(
  days: number = 30
): Promise<{ date: string; count: number }[]> {
  const supabase = getSupabaseAdmin();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('user_profiles')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (!data) return [];

  // Group by date
  const groupedData: Record<string, number> = {};
  data.forEach(user => {
    const date = new Date(user.created_at).toISOString().split('T')[0];
    groupedData[date] = (groupedData[date] || 0) + 1;
  });

  return Object.entries(groupedData).map(([date, count]) => ({ date, count }));
}

/**
 * Gets subscription distribution data
 */
export async function getSubscriptionDistribution(): Promise<
  { plan: string; count: number; percentage: number }[]
> {
  const supabase = getSupabaseAdmin();

  const { data, count: total } = await supabase
    .from('user_profiles')
    .select('subscription_plan', { count: 'exact' });

  if (!data || !total) return [];

  const planCounts: Record<string, number> = {};
  data.forEach(user => {
    const plan = user.subscription_plan || 'free';
    planCounts[plan] = (planCounts[plan] || 0) + 1;
  });

  return Object.entries(planCounts).map(([plan, count]) => ({
    plan,
    count,
    percentage: Math.round((count / total) * 100),
  }));
}
