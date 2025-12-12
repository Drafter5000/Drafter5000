import { getServerSupabaseSession, getServerSupabaseClient } from '@/lib/supabase-client';
import { getSentArticlesCount } from '@/lib/usage-limits';
import { type NextRequest, NextResponse } from 'next/server';

// Default plan limits as fallback
const DEFAULT_PLAN_LIMITS: Record<string, number> = {
  free: 2,
  pro: 20,
  enterprise: 100,
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getServerSupabaseClient();

    // Get user's current plan
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_plan')
      .eq('id', session.user.id)
      .single();

    const plan = profile?.subscription_plan || 'free';

    // Try to get plan details from database by ID
    const { data: planDetails } = await supabase
      .from('subscription_plans')
      .select('articles_per_month')
      .eq('id', plan)
      .single();

    const articlesLimit = planDetails?.articles_per_month ?? DEFAULT_PLAN_LIMITS[plan] ?? 2;

    // Get sent articles count from Google Sheets (topics with "Sent" status)
    // "Sent" = article generated, so this is the usage metric
    const articlesUsed = await getSentArticlesCount(session.user.id);

    return NextResponse.json({
      plan,
      articles_used: articlesUsed,
      articles_limit: articlesLimit,
      percentage_used: Math.round((articlesUsed / articlesLimit) * 100),
      can_generate: articlesUsed < articlesLimit,
    });
  } catch (error: any) {
    console.error('Usage fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
