import { getGoogleAuth } from '@/lib/google-sheets';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getServerSupabaseClient } from '@/lib/supabase-client';
import { google } from 'googleapis';
import { type NextRequest, NextResponse } from 'next/server';

interface Topic {
  rowIndex: number;
  topic: string;
  status: string;
  subject: string;
  article: string;
  lastUpdate: string;
  client: string;
}

/**
 * Calculate percentage change between two values
 * Returns null if previous value is 0 (can't calculate percentage)
 */
function calculatePercentageChange(
  current: number,
  previous: number
): { value: number; isPositive: boolean } | null {
  if (previous === 0) {
    // If previous is 0 and current > 0, show as positive growth
    if (current > 0) {
      return { value: 100, isPositive: true };
    }
    return null;
  }

  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    isPositive: change >= 0,
  };
}

/**
 * Fetch topics from Google Sheets for a user
 */
async function fetchTopicsFromSheets(userId: string): Promise<Topic[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get user's article style to find their sheet name
    const { data: style, error: styleError } = await supabaseAdmin
      .from('article_styles')
      .select('display_name, name, user_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (styleError || !style) {
      return [];
    }

    const sheetName = style.display_name || style.name || userId;
    const spreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID;

    if (!spreadsheetId) {
      return [];
    }

    // Escape sheet name for use in ranges
    const escapedSheetName =
      sheetName.includes(' ') || sheetName.includes("'")
        ? `'${sheetName.replace(/'/g, "''")}'`
        : sheetName;

    const auth = getGoogleAuth(['https://www.googleapis.com/auth/spreadsheets.readonly']);
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${escapedSheetName}!A2:F`,
    });

    const rows = response.data.values || [];
    return rows.map((row, index) => ({
      rowIndex: index + 2,
      topic: row[0] || '',
      status: row[1] || 'Needs Draft',
      subject: row[2] || '',
      article: row[3] || '',
      lastUpdate: row[4] || '',
      client: row[5] || '',
    }));
  } catch (error) {
    console.error('Failed to fetch topics from sheets:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const supabase = await getServerSupabaseClient();

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('display_name, email')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Calculate date ranges for current and previous month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Fetch all articles for metrics (not limited)
    const { data: allArticles, error: allArticlesError } = await supabase
      .from('articles')
      .select('id, subject, status, generated_at, sent_at')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false });

    if (allArticlesError) throw allArticlesError;

    const articles = allArticles || [];

    // Fetch topics from Google Sheets to get accurate sent count
    const topics = await fetchTopicsFromSheets(userId);
    const topicsSentCount = topics.filter(t => t.status.toLowerCase() === 'sent').length;
    const topicsDraftCount = topics.filter(
      t => t.status === 'Needs Draft' || t.status.toLowerCase() === 'draft'
    ).length;

    // Calculate current month metrics
    const currentMonthArticles = articles.filter(
      a => new Date(a.generated_at) >= currentMonthStart
    );
    const currentGenerated = currentMonthArticles.length;
    // Use topics sent count for current month (topics don't have timestamps, so use total)
    const currentSent = topicsSentCount;
    const currentDrafts = topicsDraftCount;

    // Calculate previous month metrics (for articles only, topics don't have timestamps)
    const previousMonthArticles = articles.filter(a => {
      const date = new Date(a.generated_at);
      return date >= previousMonthStart && date <= previousMonthEnd;
    });
    const previousGenerated = previousMonthArticles.length;
    // Previous month sent/drafts - we don't have historical topic data, so set to 0
    const previousSent = 0;
    const previousDrafts = 0;

    // Calculate trends
    const generatedTrend = calculatePercentageChange(currentGenerated, previousGenerated);
    const sentTrend = calculatePercentageChange(currentSent, previousSent);
    const draftsTrend = calculatePercentageChange(currentDrafts, previousDrafts);

    // Total metrics - use topics for sent/draft counts (source of truth)
    const totalGenerated = articles.length;
    const totalSent = topicsSentCount;
    const totalDrafts = topicsDraftCount;

    const metrics = {
      articles_generated: totalGenerated,
      articles_sent: totalSent,
      draft_articles: totalDrafts,
      trends: {
        articles_generated: generatedTrend,
        articles_sent: sentTrend,
        draft_articles: draftsTrend,
      },
    };

    // Get recent articles (limited to 10 for display)
    const recentArticles = articles.slice(0, 10);

    return NextResponse.json({
      profile: profileData || {},
      metrics,
      recentArticles,
    });
  } catch (error: unknown) {
    console.error('Dashboard metrics error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch metrics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
