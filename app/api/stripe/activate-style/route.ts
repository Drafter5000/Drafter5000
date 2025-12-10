import { getServerSupabaseUser } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { syncStyleToSheets } from '@/lib/services/article-styles-sync';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/stripe/activate-style
 *
 * Activates pending article styles for the authenticated user after payment.
 * Also syncs the activated style to Google Sheets.
 * Uses getUser() for secure authentication instead of getSession().
 *
 * Requirements: 2.1, 2.2, 3.1, 3.2, 3.3
 */
export async function POST(request: NextRequest) {
  try {
    // Use getUser() for secure authentication (validates token with Supabase Auth server)
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const userId = user.id;

    // Query for pending article styles belonging to the user
    const { data: pendingStyles, error: queryError } = await supabaseAdmin
      .from('article_styles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('Failed to query pending styles:', queryError);
      return NextResponse.json({ error: 'Failed to query styles' }, { status: 500 });
    }

    // If no pending style exists, return success (skip activation)
    if (!pendingStyles || pendingStyles.length === 0) {
      return NextResponse.json({
        success: true,
        style: null,
        sheetsSync: null,
        message: 'No pending style to activate',
      });
    }

    const pendingStyle = pendingStyles[0];

    // Activate the style (set is_active: true, status: 'active')
    const { data: activatedStyle, error: updateError } = await supabaseAdmin
      .from('article_styles')
      .update({
        is_active: true,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingStyle.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to activate style:', updateError);
      return NextResponse.json({ error: 'Failed to activate style' }, { status: 500 });
    }

    // Get user profile for job field
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('job')
      .eq('id', userId)
      .single();

    // Sync to Google Sheets (non-blocking, capture result)
    let sheetsSyncResult = { success: true, error: undefined as string | undefined };
    try {
      const syncResult = await syncStyleToSheets(activatedStyle, userProfile?.job || '');
      sheetsSyncResult = {
        success: syncResult.success,
        error: syncResult.error,
      };
      if (!syncResult.success) {
        console.error('Google Sheets sync failed:', syncResult.error);
      }
    } catch (syncError) {
      console.error('Google Sheets sync error:', syncError);
      sheetsSyncResult = {
        success: false,
        error: syncError instanceof Error ? syncError.message : 'Sync failed',
      };
    }

    // Mark onboarding as completed
    await supabaseAdmin
      .from('user_profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      style: activatedStyle,
      sheetsSync: sheetsSyncResult,
      message: 'Style activated successfully',
    });
  } catch (error: unknown) {
    console.error('Activate style error:', error);
    const message = error instanceof Error ? error.message : 'Failed to activate style';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
