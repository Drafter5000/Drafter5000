'use server';

import { getGoogleAuth } from '@/lib/google-sheets';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getServerSupabaseClient } from '@/lib/supabase-client';
import type { Article } from '@/lib/types';
import { google } from 'googleapis';

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

    // Fetch topics from Google Sheets to get accurate sent count
    const topics = await fetchTopicsFromSheets(userId);
    const topicsSentCount = topics.filter(t => t.status.toLowerCase() === 'sent').length;

    const [articlesCount, thisMonthCount] = await Promise.all([
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('user_id', userId),

      supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
    ]);

    return {
      total_articles: articlesCount.count || 0,
      articles_sent: topicsSentCount, // Use topics sent count from Google Sheets
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
