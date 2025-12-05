import { type NextRequest, NextResponse } from 'next/server';
import { listArticleStyles, createArticleStyle } from '@/lib/services/article-styles';
import { syncStyleToSheets } from '@/lib/services/article-styles-sync';
import { getServerSupabaseClient } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const styles = await listArticleStyles(userId);
    return NextResponse.json(styles);
  } catch (error: unknown) {
    console.error('Error listing article styles:', error);
    const message = error instanceof Error ? error.message : 'Failed to list styles';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      name,
      style_samples,
      subjects,
      email,
      display_name,
      preferred_language,
      delivery_days,
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (!style_samples || !Array.isArray(style_samples) || style_samples.length === 0) {
      return NextResponse.json({ error: 'At least one style sample is required' }, { status: 400 });
    }

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json({ error: 'At least one subject is required' }, { status: 400 });
    }

    const style = await createArticleStyle({
      user_id,
      name,
      style_samples,
      subjects,
      email,
      display_name,
      preferred_language,
      delivery_days,
    });

    // Sync to Google Sheets (non-blocking)
    syncStyleToSheets(style).then(result => {
      if (result.success && (result.sheetsConfigId || result.sheetsRowId)) {
        // Update style with sheets references
        getServerSupabaseClient().then(supabase => {
          supabase
            .from('article_styles')
            .update({
              sheets_config_id: result.sheetsConfigId,
              sheets_row_id: result.sheetsRowId,
            })
            .eq('id', style.id);
        });
      }
    });

    return NextResponse.json(style, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating article style:', error);
    const message = error instanceof Error ? error.message : 'Failed to create style';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
