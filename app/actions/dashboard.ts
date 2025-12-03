'use server';

import { getServerSupabaseClient } from '@/lib/supabase-client';
import type { Article } from '@/lib/types';

export async function getArticles(userId: string, limit = 20) {
  try {
    const supabase = await getServerSupabaseClient();

    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return articles as Article[];
  } catch (error) {
    console.error('[Dashboard] Get articles error:', error);
    return [];
  }
}

export async function getDashboardMetrics(userId: string) {
  try {
    const supabase = await getServerSupabaseClient();

    const [articlesCount, sentCount, thisMonthCount] = await Promise.all([
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('user_id', userId),

      supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'sent'),

      supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
    ]);

    return {
      total_articles: articlesCount.count || 0,
      articles_sent: sentCount.count || 0,
      this_month: thisMonthCount.count || 0,
    };
  } catch (error) {
    console.error('[Dashboard] Metrics error:', error);
    return {
      total_articles: 0,
      articles_sent: 0,
      this_month: 0,
    };
  }
}

export async function updateUserSettings(
  userId: string,
  settings: {
    display_name?: string;
    preferred_language?: string;
    delivery_days?: string[];
  }
) {
  try {
    const supabase = await getServerSupabaseClient();

    if (settings.display_name) {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: settings.display_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    }

    if (settings.preferred_language || settings.delivery_days) {
      const { error } = await supabase
        .from('onboarding_data')
        .update({
          ...(settings.preferred_language && { preferred_language: settings.preferred_language }),
          ...(settings.delivery_days && { delivery_days: settings.delivery_days }),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[Dashboard] Settings update error:', error);
    throw error;
  }
}
