import { getSupabaseAdmin } from '../supabase-admin';

export interface UsageMetrics {
  organization_id: string;
  organization_name: string;
  article_count: number;
  articles_this_month: number;
  storage_bytes: number;
  api_calls_month: number;
  member_count: number;
  last_activity: string | null;
}

export interface PlatformUsageMetrics {
  total_articles: number;
  articles_this_month: number;
  total_users: number;
  active_users_month: number;
  total_organizations: number;
  total_storage_bytes: number;
  api_calls_month: number;
}

/**
 * Gets usage metrics for a specific organization
 */
export async function getUsageMetrics(orgId: string): Promise<UsageMetrics | null> {
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

  // Get member count and user IDs
  const { data: members, count: memberCount } = await supabase
    .from('organization_members')
    .select('user_id', { count: 'exact' })
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const userIds = members?.map(m => m.user_id) || [];

  // Get article count for users in this organization
  let articleCount = 0;
  let articlesThisMonth = 0;
  let lastActivity: string | null = null;

  if (userIds.length > 0) {
    const { count: totalArticles } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .in('user_id', userIds);

    articleCount = totalArticles || 0;

    // Articles this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: monthlyArticles } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .in('user_id', userIds)
      .gte('created_at', startOfMonth.toISOString());

    articlesThisMonth = monthlyArticles || 0;

    // Get last activity
    const { data: lastArticle } = await supabase
      .from('articles')
      .select('created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    lastActivity = lastArticle?.created_at || null;
  }

  // Mock storage and API calls - in real app these would come from actual metrics
  const storageBytes = articleCount * 5000; // ~5KB per article estimate
  const apiCallsMonth = articlesThisMonth * 10; // ~10 API calls per article

  return {
    organization_id: org.id,
    organization_name: org.name,
    article_count: articleCount,
    articles_this_month: articlesThisMonth,
    storage_bytes: storageBytes,
    api_calls_month: apiCallsMonth,
    member_count: memberCount || 0,
    last_activity: lastActivity,
  };
}

/**
 * Gets platform-wide usage metrics (Super Admin only)
 */
export async function getPlatformUsageMetrics(): Promise<PlatformUsageMetrics> {
  const supabase = getSupabaseAdmin();

  // Get total articles
  const { count: totalArticles } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true });

  // Articles this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: articlesThisMonth } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString());

  // Get total users
  const { count: totalUsers } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true });

  // Active users this month (users who created articles)
  const { data: activeUserIds } = await supabase
    .from('articles')
    .select('user_id')
    .gte('created_at', startOfMonth.toISOString());

  const uniqueActiveUsers = new Set(activeUserIds?.map(a => a.user_id) || []);

  // Get total organizations
  const { count: totalOrgs } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  // Mock storage and API calls
  const totalStorageBytes = (totalArticles || 0) * 5000;
  const apiCallsMonth = (articlesThisMonth || 0) * 10;

  return {
    total_articles: totalArticles || 0,
    articles_this_month: articlesThisMonth || 0,
    total_users: totalUsers || 0,
    active_users_month: uniqueActiveUsers.size,
    total_organizations: totalOrgs || 0,
    total_storage_bytes: totalStorageBytes,
    api_calls_month: apiCallsMonth,
  };
}
