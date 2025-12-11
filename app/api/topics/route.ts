import { getServerSupabaseUser } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getGoogleAuth } from '@/lib/google-sheets';
import { google } from 'googleapis';
import { type NextRequest, NextResponse } from 'next/server';

export interface Topic {
  rowIndex: number;
  topic: string;
  status: string;
  subject: string;
  article: string;
  lastUpdate: string;
  client: string;
}

/**
 * GET /api/topics
 * Fetch topics from the user's Google Sheet
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get user's article style to find their sheet name
    const { data: style, error: styleError } = await supabaseAdmin
      .from('article_styles')
      .select('display_name, name, user_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (styleError || !style) {
      return NextResponse.json({ topics: [], message: 'No active style found' });
    }

    const sheetName = style.display_name || style.name || user.id;
    // Use Customers spreadsheet for customer sheets (tabs)
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

    // Fetch all data from the customer sheet (tab) in Customers spreadsheet
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${escapedSheetName}!A2:F`,
      });

      const rows = response.data.values || [];
      const topics: Topic[] = rows.map((row, index) => ({
        rowIndex: index + 2, // +2 because we start from row 2 (1-indexed, skip header)
        topic: row[0] || '',
        status: row[1] || 'Needs Draft',
        subject: row[2] || '',
        article: row[3] || '',
        lastUpdate: row[4] || '',
        client: row[5] || '',
      }));

      return NextResponse.json({ topics, sheetName });
    } catch (sheetsError: unknown) {
      // If sheet doesn't exist, return empty topics array instead of error
      const errorMessage = sheetsError instanceof Error ? sheetsError.message : '';
      if (errorMessage.includes('Unable to parse range') || errorMessage.includes('not found')) {
        console.log(
          `Sheet "${sheetName}" not found in Customers spreadsheet, returning empty topics`
        );
        return NextResponse.json({ topics: [], sheetName, message: 'Sheet not yet created' });
      }
      throw sheetsError;
    }
  } catch (error: unknown) {
    console.error('Failed to fetch topics:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch topics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/topics
 * Add a new topic to the user's Google Sheet
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic } = await request.json();
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get user's article style
    const { data: style, error: styleError } = await supabaseAdmin
      .from('article_styles')
      .select('display_name, name, subjects')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (styleError || !style) {
      return NextResponse.json({ error: 'No active style found' }, { status: 404 });
    }

    const sheetName = style.display_name || style.name || user.id;
    // Use Customers spreadsheet for customer sheets (tabs)
    const spreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID;

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Google Sheets not configured' }, { status: 500 });
    }

    const escapedSheetName =
      sheetName.includes(' ') || sheetName.includes("'")
        ? `'${sheetName.replace(/'/g, "''")}'`
        : sheetName;

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Check if topic already exists in the sheet (prevent duplicates)
    let existingTopics: string[] = [];
    try {
      const existingData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${escapedSheetName}!A:A`,
      });
      existingTopics = (existingData.data.values || [])
        .flat()
        .map((t: string) => t?.toLowerCase?.() || '');
    } catch {
      // Sheet might not exist yet, continue
    }

    // Check if topic already exists (case-insensitive)
    if (existingTopics.includes(topic.toLowerCase())) {
      return NextResponse.json({ error: 'Topic already exists' }, { status: 409 });
    }

    // Check if topic already exists in article_styles subjects
    if (style.subjects?.some((s: string) => s.toLowerCase() === topic.toLowerCase())) {
      return NextResponse.json({ error: 'Topic already exists' }, { status: 409 });
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const clientName = style.display_name || style.name || '';

    // Add new topic row to customer sheet (tab) in Customers spreadsheet
    // Note: Subject column (C) is not populated from code - it should be managed separately
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${escapedSheetName}!A2`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[topic, 'Needs Draft', '', '', currentDate, clientName]],
      },
    });

    // Also update subjects in article_styles (only if not already present)
    const updatedSubjects = [...(style.subjects || []), topic];
    await supabaseAdmin
      .from('article_styles')
      .update({ subjects: updatedSubjects, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true);

    return NextResponse.json({ success: true, topic });
  } catch (error: unknown) {
    console.error('Failed to add topic:', error);
    const message = error instanceof Error ? error.message : 'Failed to add topic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
