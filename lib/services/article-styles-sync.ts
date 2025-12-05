import { appendToMainSheet } from '@/lib/google-sheets';
import type { ArticleStyle } from '@/lib/types';

export interface SyncResult {
  success: boolean;
  sheetsConfigId?: string;
  sheetsRowId?: string;
  error?: string;
}

export async function syncStyleToSheets(style: ArticleStyle): Promise<SyncResult> {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID;

    if (!spreadsheetId) {
      console.warn('Google Sheets ID not configured, skipping sync');
      return { success: true };
    }

    const customerSheetName = `${(style.display_name || style.name).replace(/\s/g, '_')}_${style.id.slice(0, 8)}`;

    // Append to Main Sheet only
    await appendToMainSheet(spreadsheetId, {
      sheetName: customerSheetName,
      customerName: style.display_name || style.name,
      customerEmail: style.email || '',
      language: style.preferred_language,
      emailMonday: style.delivery_days.includes('mon'),
      emailTuesday: style.delivery_days.includes('tue'),
      emailWednesday: style.delivery_days.includes('wed'),
      emailThursday: style.delivery_days.includes('thu'),
      emailFriday: style.delivery_days.includes('fri'),
      emailSaturday: style.delivery_days.includes('sat'),
      emailSunday: style.delivery_days.includes('sun'),
      paywallStatus: 'active',
      endOfMembership: '',
      customerSheetCreated: new Date().toISOString(),
      article1Example: style.style_samples[0] || '',
      article2Example: style.style_samples[1] || '',
      article3Example: style.style_samples[2] || '',
    });

    return {
      success: true,
      sheetsConfigId: spreadsheetId,
    };
  } catch (error) {
    console.error('Failed to sync style to Google Sheets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteStyleFromSheets(styleId: string): Promise<SyncResult> {
  try {
    // Note: Google Sheets API doesn't easily support row deletion by ID
    // For now, we log the deletion and handle it manually or via a cleanup job
    console.log(
      `Style ${styleId} deleted from PostgreSQL. Manual cleanup may be needed in Sheets.`
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to delete style from Google Sheets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateStyleInSheets(style: ArticleStyle): Promise<SyncResult> {
  try {
    // For updates, we would need to find and update the specific row
    // This is complex with Google Sheets API, so we log for now
    console.log(`Style ${style.id} updated. Sheets sync for updates not yet implemented.`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update style in Google Sheets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
