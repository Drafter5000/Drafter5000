import { type NextRequest, NextResponse } from 'next/server';
import { saveDraft, completeDraft, getDraft } from '@/lib/services/article-styles';
import { syncStyleToSheets } from '@/lib/services/article-styles-sync';
import { getServerSupabaseClient } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { user_id, draft_id, name, email, display_name, preferred_language, delivery_days } =
      await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (!draft_id) {
      return NextResponse.json(
        { error: 'draft_id is required. Complete steps 1 and 2 first.' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (!delivery_days || !Array.isArray(delivery_days) || delivery_days.length === 0) {
      return NextResponse.json({ error: 'At least one delivery day is required' }, { status: 400 });
    }

    // Save final step data
    await saveDraft({
      id: draft_id,
      user_id,
      name: name.trim(),
      email: email || null,
      display_name: display_name || null,
      preferred_language: preferred_language || 'en',
      delivery_days,
    });

    // Complete the draft (mark as active)
    const style = await completeDraft(draft_id, user_id);

    // Update user profile display name if provided
    if (display_name) {
      const supabase = await getServerSupabaseClient();
      await supabase
        .from('user_profiles')
        .update({
          display_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user_id);
    }

    // Sync to Google Sheets (non-blocking)
    syncStyleToSheets(style).then(async result => {
      if (result.success && (result.sheetsConfigId || result.sheetsRowId)) {
        const supabase = await getServerSupabaseClient();
        await supabase
          .from('article_styles')
          .update({
            sheets_config_id: result.sheetsConfigId,
            sheets_row_id: result.sheetsRowId,
          })
          .eq('id', style.id);
      }
    });

    return NextResponse.json({ success: true, style, redirectTo: '/dashboard' });
  } catch (error: unknown) {
    console.error('Error completing step 3:', error);
    const message = error instanceof Error ? error.message : 'Failed to complete setup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const draft = await getDraft(userId);
    return NextResponse.json({
      name: draft?.name || '',
      email: draft?.email || '',
      display_name: draft?.display_name || '',
      preferred_language: draft?.preferred_language || 'en',
      delivery_days: draft?.delivery_days || [],
      draft_id: draft?.id || null,
    });
  } catch (error: unknown) {
    console.error('Error getting step 3 data:', error);
    const message = error instanceof Error ? error.message : 'Failed to get data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
