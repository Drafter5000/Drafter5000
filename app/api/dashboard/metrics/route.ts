import { getServerSupabaseClient } from '@/lib/supabase-client';
import { type NextRequest, NextResponse } from 'next/server';

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

    // Calculate current month metrics
    const currentMonthArticles = articles.filter(
      a => new Date(a.generated_at) >= currentMonthStart
    );
    const currentGenerated = currentMonthArticles.length;
    const currentSent = currentMonthArticles.filter(a => a.status === 'sent').length;
    const currentDrafts = currentMonthArticles.filter(a => a.status === 'draft').length;

    // Calculate previous month metrics
    const previousMonthArticles = articles.filter(a => {
      const date = new Date(a.generated_at);
      return date >= previousMonthStart && date <= previousMonthEnd;
    });
    const previousGenerated = previousMonthArticles.length;
    const previousSent = previousMonthArticles.filter(a => a.status === 'sent').length;
    const previousDrafts = previousMonthArticles.filter(a => a.status === 'draft').length;

    // Calculate trends
    const generatedTrend = calculatePercentageChange(currentGenerated, previousGenerated);
    const sentTrend = calculatePercentageChange(currentSent, previousSent);
    const draftsTrend = calculatePercentageChange(currentDrafts, previousDrafts);

    // Total metrics (all time)
    const totalGenerated = articles.length;
    const totalSent = articles.filter(a => a.status === 'sent').length;
    const totalDrafts = articles.filter(a => a.status === 'draft').length;

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
  } catch (error: any) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
