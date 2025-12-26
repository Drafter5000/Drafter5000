import { google } from 'googleapis';
import { getGoogleAuth } from '../google-sheets';
import { getSupabaseAdmin } from '../supabase-admin';

export interface UserStats {
  user_id: string;
  articles_generated: number;
  articles_sent: number;
  articles_draft: number;
  articles_in_progress: number;
  articles_review: number;
  total_topics: number;
  generated_trend_value: number;
  generated_trend_positive: boolean;
  sent_trend_value: number;
  sent_trend_positive: boolean;
  last_synced_at: string;
}

export interface SyncResult {
  success: boolean;
  stats?: UserStats;
  error?: string;
}

/**
 * Fetches topic stats from a user's Google Sheet
 */
async function fetchSheetStats(
  sheetName: string,
  spreadsheetId: string
): Promise<{
  sent: number;
  draft: number;
  inProgress: number;
  review: number;
  total: number;
}> {
  const escapedSheetName =
    sheetName.includes(' ') || sheetName.includes("'")
      ? `'${sheetName.replace(/'/g, "''")}'`
      : sheetName;

  try {
    const auth = getGoogleAuth(['https://www.googleapis.com/auth/spreadsheets.readonly']);
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${escapedSheetName}!B2:B`, // Column B is status
    });

    const rows = response.data.values || [];
    let sent = 0;
    let draft = 0;
    let inProgress = 0;
    let review = 0;

    for (const row of rows) {
      const status = (row[0] || '').toString().toLowerCase();
      if (status === 'sent') sent++;
      else if (status === 'needs draft' || status === 'draft') draft++;
      else if (status === 'in progress') inProgress++;
      else if (status === 'review') review++;
    }

    return {
      sent,
      draft,
      inProgress,
      review,
      total: rows.length,
    };
  } catch (error) {
    console.warn(`Could not read sheet "${sheetName}":`, error);
    return { sent: 0, draft: 0, inProgress: 0, review: 0, total: 0 };
  }
}

/**
 * Syncs stats from Google Sheets to the database for a single user
 */
export async function syncUserStats(userId: string): Promise<SyncResult> {
  const supabase = getSupabaseAdmin();
  const spreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID;

  if (!spreadsheetId) {
    return { success: false, error: 'Google Sheets not configured' };
  }

  try {
    // Get user's article style to find their sheet name
    const { data: style, error: styleError } = await supabase
      .from('article_styles')
      .select('display_name, name, subjects')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (styleError || !style) {
      // User has no style yet, create empty stats
      const emptyStats: UserStats = {
        user_id: userId,
        articles_generated: 0,
        articles_sent: 0,
        articles_draft: 0,
        articles_in_progress: 0,
        articles_review: 0,
        total_topics: 0,
        generated_trend_value: 0,
        generated_trend_positive: true,
        sent_trend_value: 0,
        sent_trend_positive: true,
        last_synced_at: new Date().toISOString(),
      };

      await upsertUserStats(supabase, emptyStats);
      return { success: true, stats: emptyStats };
    }

    const sheetName = style.display_name || style.name || userId;

    // Fetch stats from Google Sheets
    const sheetStats = await fetchSheetStats(sheetName, spreadsheetId);

    // Get articles count from database
    const { count: articlesCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get previous stats for trend calculation
    const { data: previousStats } = await supabase
      .from('user_stats')
      .select('articles_generated, articles_sent')
      .eq('user_id', userId)
      .single();

    // Calculate trends
    const prevGenerated = previousStats?.articles_generated || 0;
    const prevSent = previousStats?.articles_sent || 0;
    const currentGenerated = articlesCount || 0;
    const currentSent = sheetStats.sent;

    let generatedTrendValue = 0;
    let generatedTrendPositive = true;
    let sentTrendValue = 0;
    let sentTrendPositive = true;

    if (prevGenerated > 0) {
      const change = ((currentGenerated - prevGenerated) / prevGenerated) * 100;
      generatedTrendValue = Math.abs(Math.round(change));
      generatedTrendPositive = change >= 0;
    } else if (currentGenerated > 0) {
      generatedTrendValue = 100;
      generatedTrendPositive = true;
    }

    if (prevSent > 0) {
      const change = ((currentSent - prevSent) / prevSent) * 100;
      sentTrendValue = Math.abs(Math.round(change));
      sentTrendPositive = change >= 0;
    } else if (currentSent > 0) {
      sentTrendValue = 100;
      sentTrendPositive = true;
    }

    const stats: UserStats = {
      user_id: userId,
      articles_generated: currentGenerated,
      articles_sent: sheetStats.sent,
      articles_draft: sheetStats.draft,
      articles_in_progress: sheetStats.inProgress,
      articles_review: sheetStats.review,
      total_topics: sheetStats.total,
      generated_trend_value: generatedTrendValue,
      generated_trend_positive: generatedTrendPositive,
      sent_trend_value: sentTrendValue,
      sent_trend_positive: sentTrendPositive,
      last_synced_at: new Date().toISOString(),
    };

    await upsertUserStats(supabase, stats);

    return { success: true, stats };
  } catch (error) {
    console.error('Failed to sync user stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync stats',
    };
  }
}

/**
 * Upserts user stats into the database
 */
async function upsertUserStats(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  stats: UserStats
): Promise<void> {
  const { error } = await supabase.from('user_stats').upsert(
    {
      user_id: stats.user_id,
      articles_generated: stats.articles_generated,
      articles_sent: stats.articles_sent,
      articles_draft: stats.articles_draft,
      articles_in_progress: stats.articles_in_progress,
      articles_review: stats.articles_review,
      total_topics: stats.total_topics,
      generated_trend_value: stats.generated_trend_value,
      generated_trend_positive: stats.generated_trend_positive,
      sent_trend_value: stats.sent_trend_value,
      sent_trend_positive: stats.sent_trend_positive,
      last_synced_at: stats.last_synced_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw new Error(`Failed to upsert user stats: ${error.message}`);
  }
}

/**
 * Gets cached stats from the database, or syncs if stale
 */
export async function getUserStats(
  userId: string,
  maxAgeMinutes: number = 5
): Promise<UserStats | null> {
  const supabase = getSupabaseAdmin();

  // Try to get cached stats
  const { data: cachedStats, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching cached stats:', error);
  }

  // Check if stats are fresh enough
  if (cachedStats?.last_synced_at) {
    const lastSynced = new Date(cachedStats.last_synced_at);
    const now = new Date();
    const ageMinutes = (now.getTime() - lastSynced.getTime()) / (1000 * 60);

    if (ageMinutes < maxAgeMinutes) {
      return cachedStats as UserStats;
    }
  }

  // Stats are stale or don't exist, sync them
  const syncResult = await syncUserStats(userId);
  return syncResult.stats || null;
}

/**
 * Syncs stats for all active users (for background job)
 */
export async function syncAllUserStats(): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  const supabase = getSupabaseAdmin();

  // Get all users with active article styles
  const { data: styles, error } = await supabase
    .from('article_styles')
    .select('user_id')
    .eq('is_active', true);

  if (error || !styles) {
    return { synced: 0, failed: 0, errors: ['Failed to fetch users'] };
  }

  const userIds = [...new Set(styles.map(s => s.user_id))];
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const userId of userIds) {
    const result = await syncUserStats(userId);
    if (result.success) {
      synced++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`User ${userId}: ${result.error}`);
      }
    }
  }

  return { synced, failed, errors };
}
