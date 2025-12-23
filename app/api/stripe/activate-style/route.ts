import { getServerSupabaseUser } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { syncStyleToSheets } from '@/lib/services/article-styles-sync';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/stripe/activate-style
 *
 * Activates pending article styles for the authenticated user after payment.
 * Also syncs the activated style to Google Sheets.
 *
 * This API handles two scenarios:
 * 1. Style already exists in article_styles (created by webhook) - just activate it
 * 2. Style only exists in pending_style_data (webhook hasn't processed yet) - create and activate
 *
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

    // Get user profile for email and job field
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('email, job')
      .eq('id', userId)
      .single();

    // First, check if there's already an article_style (created by webhook)
    const { data: existingStyles, error: queryError } = await supabaseAdmin
      .from('article_styles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('Failed to query existing styles:', queryError);
      return NextResponse.json({ error: 'Failed to query styles' }, { status: 500 });
    }

    let activatedStyle = null;
    let job = userProfile?.job || '';

    // If style exists, activate it if not already active
    if (existingStyles && existingStyles.length > 0) {
      const existingStyle = existingStyles[0];

      if (!existingStyle.is_active) {
        // Activate the existing style
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('article_styles')
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingStyle.id)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to activate style:', updateError);
          return NextResponse.json({ error: 'Failed to activate style' }, { status: 500 });
        }
        activatedStyle = updated;
      } else {
        // Already active
        activatedStyle = existingStyle;
      }
    } else {
      // No article_style exists - check pending_style_data and create one
      const { data: pendingData, error: pendingError } = await supabaseAdmin
        .from('pending_style_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (pendingError || !pendingData) {
        // No pending data either - nothing to activate
        return NextResponse.json({
          success: true,
          style: null,
          sheetsSync: null,
          message: 'No pending style to activate',
        });
      }

      // Create article_style from pending_style_data
      job = pendingData.job || job;

      const styleData = {
        user_id: userId,
        name: 'Settings',
        style_samples: pendingData.style_samples || [],
        subjects: pendingData.subjects || [],
        email: userProfile?.email || '',
        display_name: pendingData.display_name || '',
        preferred_language: pendingData.preferred_language || 'en',
        delivery_days: pendingData.delivery_days || [],
        is_active: true,
      };

      console.log('Creating article style with data:', JSON.stringify(styleData, null, 2));

      const { data: newStyle, error: createError } = await supabaseAdmin
        .from('article_styles')
        .insert(styleData)
        .select()
        .single();

      if (createError) {
        console.error('Failed to create article style:', createError);
        console.error('Create error details:', JSON.stringify(createError, null, 2));
        return NextResponse.json(
          {
            error: `Failed to create style: ${createError.message || createError.code || 'Unknown error'}`,
          },
          { status: 500 }
        );
      }

      activatedStyle = newStyle;

      // Clean up pending_style_data
      await supabaseAdmin.from('pending_style_data').delete().eq('user_id', userId);
    }

    // Sync to Google Sheets ONLY if not already synced
    // Check if style was just created (not existing) to prevent duplicate syncs
    console.log('[ActivateStyle] Checking if Google Sheets sync is needed...');

    let sheetsSyncResult = { success: true, error: undefined as string | undefined };

    // Only sync if:
    // 1. Style exists
    // 2. Style doesn't have sheets_synced flag set to true
    const needsSync = activatedStyle && !activatedStyle.sheets_synced;
    console.log('[ActivateStyle] Needs sync:', needsSync);
    console.log('[ActivateStyle] sheets_synced flag:', activatedStyle?.sheets_synced);

    if (needsSync) {
      try {
        console.log('[ActivateStyle] Calling syncStyleToSheets...');
        const syncResult = await syncStyleToSheets(activatedStyle, job);
        console.log('[ActivateStyle] Sync result:', JSON.stringify(syncResult, null, 2));

        if (syncResult.success) {
          // Mark style as synced to prevent future duplicate syncs
          await supabaseAdmin
            .from('article_styles')
            .update({ sheets_synced: true, updated_at: new Date().toISOString() })
            .eq('id', activatedStyle.id);
          console.log('[ActivateStyle] Marked style as sheets_synced');
        }

        sheetsSyncResult = {
          success: syncResult.success,
          error: syncResult.error,
        };
      } catch (syncError) {
        console.error('[ActivateStyle] Google Sheets sync error:', syncError);
        sheetsSyncResult = {
          success: false,
          error: syncError instanceof Error ? syncError.message : 'Sync failed',
        };
      }
    } else if (activatedStyle?.sheets_synced) {
      console.log('[ActivateStyle] Style already synced to Google Sheets, skipping');
    } else {
      console.log('[ActivateStyle] No activated style to sync');
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
