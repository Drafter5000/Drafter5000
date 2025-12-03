import { getServerSupabaseClient } from '@/lib/supabase-client';
import { type NextRequest, NextResponse } from 'next/server';

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

    // Fetch onboarding data (includes preferred_language)
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('onboarding_data')
      .select('style_samples, subjects, delivery_days, preferred_language')
      .eq('user_id', userId)
      .single();

    if (onboardingError && onboardingError.code !== 'PGRST116') throw onboardingError;

    // Fetch articles metrics
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select('id, subject, status, generated_at, sent_at')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(10);

    if (articlesError) throw articlesError;

    const metrics = {
      articles_generated: articlesData?.length || 0,
      articles_sent: articlesData?.filter(a => a.status === 'sent').length || 0,
      draft_articles: articlesData?.filter(a => a.status === 'draft').length || 0,
    };

    return NextResponse.json({
      profile: profileData || {},
      onboarding: onboardingData || {
        style_samples: [],
        subjects: [],
        delivery_days: [],
        preferred_language: 'English',
      },
      metrics,
      recentArticles: articlesData || [],
    });
  } catch (error: any) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
