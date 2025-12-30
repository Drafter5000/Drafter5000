/**
 * POST /api/topics/sync
 * Sync topics from Google Sheets to the article_styles.subjects array in the database
 * This ensures the database stays in sync with the sheet
 */

import { getServerSupabaseUser } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getGoogleAuth } from '@/lib/google-sheets';
import { google } from 'googleapis';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get user's article style to find their sheet name
    const { data: style, error: styleError } = await supabaseAdmin
      .from('article_styles')
      .select('id, display_name, name, subjects')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (styleError || !style) {
      return NextResponse.json({ error: 'No active style found' }, { status: 404 });
    }

    const sheetName = style.display_name || style.name || user.id;
    const spreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID;

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Google Sheets not configured' }, { status: 500 });
    }

    // Escape sheet name for use in ranges
    const escapedSheetName =
      sheetName.includes(' ') || sheetName.includes("'")
        ? `'${sheetName.replace(/'/g, "''")}'`
        : sheetName;

    const auth = getGoogleAuth(['https://www.googleapis.com/auth/spreadsheets.readonly']);
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch all topics from the sheet (column A, starting from row 2)
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${escapedSheetName}!A2:A`,
      });

      const rows = response.data.values || [];
      const sheetTopics = rows
        .map(row => row[0]?.toString().trim())
        .filter(topic => topic && topic.length > 0);

      console.log(`[TopicsSync] Found ${sheetTopics.length} topics in sheet "${sheetName}"`);
      console.log(`[TopicsSync] Current subjects in DB: ${style.subjects?.length || 0}`);

      // Update the subjects array in the database
      const { error: updateError } = await supabaseAdmin
        .from('article_styles')
        .update({
          subjects: sheetTopics,
          updated_at: new Date().toISOString(),
        })
        .eq('id', style.id);

      if (updateError) {
        console.error('[TopicsSync] Failed to update subjects:', updateError);
        return NextResponse.json({ error: 'Failed to sync topics' }, { status: 500 });
      }

      console.log(
        `[TopicsSync] Synced ${sheetTopics.length} topics to database for user ${user.id}`
      );

      return NextResponse.json({
        success: true,
        synced_count: sheetTopics.length,
        previous_count: style.subjects?.length || 0,
        topics: sheetTopics,
      });
    } catch (sheetsError: unknown) {
      const errorMessage = sheetsError instanceof Error ? sheetsError.message : '';
      if (errorMessage.includes('Unable to parse range') || errorMessage.includes('not found')) {
        console.log(`[TopicsSync] Sheet "${sheetName}" not found`);
        return NextResponse.json({
          success: true,
          synced_count: 0,
          message: 'Sheet not found',
        });
      }
      throw sheetsError;
    }
  } catch (error: unknown) {
    console.error('[TopicsSync] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to sync topics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
