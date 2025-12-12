import { getServerSupabaseClient } from './supabase-client';
import { getSupabaseAdmin } from './supabase-admin';
import { getArticlesLimitForPlan } from './plan-utils';
import { getGoogleAuth } from './google-sheets';
import { google } from 'googleapis';

/**
 * Get the count of "Sent" articles from Google Sheets for the current billing period.
 * "Sent" status = article generated and delivered, which counts against the plan limit.
 */
export async function getSentArticlesCount(userId: string): Promise<number> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get user's article style to find their sheet name
    const { data: style, error: styleError } = await supabaseAdmin
      .from('article_styles')
      .select('display_name, name')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (styleError || !style) {
      return 0;
    }

    const sheetName = style.display_name || style.name || userId;
    const spreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID;

    if (!spreadsheetId) {
      return 0;
    }

    // Escape sheet name for use in ranges
    const escapedSheetName =
      sheetName.includes(' ') || sheetName.includes("'")
        ? `'${sheetName.replace(/'/g, "''")}'`
        : sheetName;

    const auth = getGoogleAuth(['https://www.googleapis.com/auth/spreadsheets.readonly']);
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch all data from the customer sheet - columns A:E
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${escapedSheetName}!A2:E`,
    });

    const rows = response.data.values || [];

    // Get current billing period (start of month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Count topics with "Sent" status that were updated this month
    let sentCount = 0;
    for (const row of rows) {
      const rowStatus = (row[1] || '').toLowerCase();
      const lastUpdate = row[4] || '';

      if (rowStatus === 'sent') {
        if (lastUpdate) {
          const updateDate = new Date(lastUpdate);
          if (updateDate >= startOfMonth) {
            sentCount++;
          }
        } else {
          sentCount++;
        }
      }
    }

    return sentCount;
  } catch (error) {
    console.error('Failed to fetch sent articles count:', error);
    return 0;
  }
}

export async function checkUsageLimit(userId: string): Promise<{
  canGenerate: boolean;
  articlesUsed: number;
  articlesLimit: number;
  plan: string;
}> {
  const supabase = await getServerSupabaseClient();

  // Get user's current plan
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
    };
  }

  // Get articles limit from database
  const limit = await getArticlesLimitForPlan(plan);

  // Get sent articles count from Google Sheets (topics with "Sent" status)
  const used = await getSentArticlesCount(userId);

  return {
    canGenerate: used < limit,
    articlesUsed: used,
    articlesLimit: limit,
    plan,
  };
}

export async function incrementUsage(userId: string, articleId: string): Promise<void> {
  // This is called after article generation
  // The article is already created, so we just need to verify it's counted
  const supabase = await getServerSupabaseClient();

  await supabase
    .from('articles')
    .update({
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId)
    .eq('user_id', userId);
}
