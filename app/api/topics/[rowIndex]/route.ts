import { getServerSupabaseUser, getServerSupabaseClient } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getGoogleAuth } from '@/lib/google-sheets';
import { google } from 'googleapis';
import { type NextRequest, NextResponse } from 'next/server';
import { checkSubscriptionAccess } from '@/lib/subscription-utils';

// Default plan limits as fallback
const DEFAULT_PLAN_LIMITS: Record<string, number> = {
  free: 2,
  pro: 20,
  enterprise: 100,
};

/**
 * Check if user can generate more articles based on their plan limit
 */
async function checkArticleLimit(
  userId: string,
  sheetName: string
): Promise<{
  canGenerate: boolean;
  articlesUsed: number;
  articlesLimit: number;
}> {
  const supabase = await getServerSupabaseClient();
  const supabaseAdmin = getSupabaseAdmin();

  // Get user's current plan
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_plan')
    .eq('id', userId)
    .single();

  const plan = profile?.subscription_plan || 'free';

  // Get plan details from database
  const { data: planDetails } = await supabase
    .from('subscription_plans')
    .select('articles_per_month')
    .eq('id', plan)
    .single();

  const articlesLimit = planDetails?.articles_per_month ?? DEFAULT_PLAN_LIMITS[plan] ?? 2;

  // Count current "Sent" articles from Google Sheets for this billing period
  const spreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID;
  if (!spreadsheetId) {
    return { canGenerate: false, articlesUsed: 0, articlesLimit };
  }

  const escapedSheetName =
    sheetName.includes(' ') || sheetName.includes("'")
      ? `'${sheetName.replace(/'/g, "''")}'`
      : sheetName;

  const auth = getGoogleAuth(['https://www.googleapis.com/auth/spreadsheets.readonly']);
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${escapedSheetName}!A2:E`,
    });

    const rows = response.data.values || [];

    // Get current billing period (start of month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Count topics with "Sent" status that were updated this month
    let sentCount = 0;
    for (const row of rows) {
      const status = (row[1] || '').toLowerCase();
      const lastUpdate = row[4] || '';

      if (status === 'sent') {
        if (lastUpdate) {
          const updateDate = new Date(lastUpdate);
          if (updateDate >= startOfMonth) {
            sentCount++;
          }
        } else {
          sentCount++;
        }
      }
    }

    return {
      canGenerate: sentCount < articlesLimit,
      articlesUsed: sentCount,
      articlesLimit,
    };
  } catch (error) {
    console.error('Failed to check article limit:', error);
    return { canGenerate: false, articlesUsed: 0, articlesLimit };
  }
}

/**
 * PUT /api/topics/[rowIndex]
 * Update a topic in the user's Google Sheet
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ rowIndex: string }> }
) {
  try {
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription status before allowing topic update
    const supabase = await getServerSupabaseClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    const subscriptionCheck = checkSubscriptionAccess(profile?.subscription_status);
    if (!subscriptionCheck.hasAccess) {
      return NextResponse.json(
        {
          error: 'Subscription required',
          message: subscriptionCheck.message,
          subscription_status: subscriptionCheck.status,
        },
        { status: 403 }
      );
    }

    const { rowIndex } = await params;
    const rowNum = parseInt(rowIndex, 10);
    if (isNaN(rowNum) || rowNum < 2) {
      return NextResponse.json({ error: 'Invalid row index' }, { status: 400 });
    }

    const { topic, status } = await request.json();

    const supabaseAdmin = getSupabaseAdmin();

    // Get user's article style
    const { data: style, error: styleError } = await supabaseAdmin
      .from('article_styles')
      .select('display_name, name')
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

    // If changing status to "Sent", check if user has reached their article limit
    if (status !== undefined && status.toLowerCase() === 'sent') {
      // First, check the current status of this topic to avoid double-counting
      try {
        const currentRow = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${escapedSheetName}!B${rowNum}`,
        });
        const currentStatus = (currentRow.data.values?.[0]?.[0] || '').toLowerCase();

        // Only check limit if the topic is not already "Sent"
        if (currentStatus !== 'sent') {
          const limitCheck = await checkArticleLimit(user.id, sheetName);

          if (!limitCheck.canGenerate) {
            return NextResponse.json(
              {
                error: 'Article limit reached',
                message: `You've reached your monthly limit of ${limitCheck.articlesLimit} articles. Please upgrade your plan to generate more articles.`,
                articlesUsed: limitCheck.articlesUsed,
                articlesLimit: limitCheck.articlesLimit,
              },
              { status: 403 }
            );
          }
        }
      } catch (error) {
        console.error('Failed to check current status:', error);
        // Continue with the update if we can't check current status
      }
    }

    const currentDate = new Date().toISOString().split('T')[0];

    // Update specific cells based on what was provided
    const updates: { range: string; values: string[][] }[] = [];

    if (topic !== undefined) {
      // Update Topic (column A) and Subject (column C)
      updates.push({
        range: `${escapedSheetName}!A${rowNum}`,
        values: [[topic]],
      });
      // updates.push({
      //   range: `${escapedSheetName}!C${rowNum}`,
      //   values: [[topic]],
      // });
    }

    if (status !== undefined) {
      // Update Status (column B)
      updates.push({
        range: `${escapedSheetName}!B${rowNum}`,
        values: [[status]],
      });
    }

    // Always update Last Update (column E)
    updates.push({
      range: `${escapedSheetName}!E${rowNum}`,
      values: [[currentDate]],
    });

    // Batch update
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to update topic:', error);
    const message = error instanceof Error ? error.message : 'Failed to update topic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/topics/[rowIndex]
 * Delete a topic from the user's Google Sheet and sync with article_styles subjects
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ rowIndex: string }> }
) {
  try {
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription status before allowing topic deletion
    const supabase = await getServerSupabaseClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    const subscriptionCheck = checkSubscriptionAccess(profile?.subscription_status);
    if (!subscriptionCheck.hasAccess) {
      return NextResponse.json(
        {
          error: 'Subscription required',
          message: subscriptionCheck.message,
          subscription_status: subscriptionCheck.status,
        },
        { status: 403 }
      );
    }

    const { rowIndex } = await params;
    const rowNum = parseInt(rowIndex, 10);
    if (isNaN(rowNum) || rowNum < 2) {
      return NextResponse.json({ error: 'Invalid row index' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get user's article style
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

    // First, get the topic text from the row before deleting (for syncing with subjects)
    let topicToDelete: string | null = null;
    try {
      const rowData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${escapedSheetName}!A${rowNum}`,
      });
      topicToDelete = rowData.data.values?.[0]?.[0] || null;
    } catch {
      // Continue even if we can't get the topic text
    }

    // Get the sheet ID for deletion
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties',
    });

    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
    if (!sheet?.properties?.sheetId) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    // Delete the row from Google Sheets
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: rowNum - 1, // 0-indexed
                endIndex: rowNum, // exclusive
              },
            },
          },
        ],
      },
    });

    // Sync: Remove the topic from article_styles subjects array
    if (topicToDelete && style.subjects?.length) {
      const updatedSubjects = style.subjects.filter(
        (s: string) => s.toLowerCase() !== topicToDelete!.toLowerCase()
      );

      // Only update if subjects actually changed
      if (updatedSubjects.length !== style.subjects.length) {
        await supabaseAdmin
          .from('article_styles')
          .update({
            subjects: updatedSubjects,
            updated_at: new Date().toISOString(),
          })
          .eq('id', style.id)
          .eq('user_id', user.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete topic:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete topic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
