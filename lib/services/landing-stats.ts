import { google } from 'googleapis';
import { getGoogleAuth } from '../google-sheets';
import { getSupabaseAdmin } from '../supabase-admin';

/**
 * Landing page statistics
 */
export interface LandingStats {
  articlesSent: number;
  activeCustomers: number;
  formattedArticles: string;
  formattedCustomers: string;
}

/**
 * Formats a number for display with appropriate suffix
 * Examples: 0 -> "0+", 5 -> "5+", 13 -> "13+", 1500 -> "1.5K+"
 */
export function formatStatNumber(value: number): string {
  if (value < 0) {
    return '0+';
  }

  if (value >= 1000000) {
    const millions = value / 1000000;
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)}M+`;
  }

  if (value >= 1000) {
    const thousands = value / 1000;
    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}K+`;
  }

  return `${Math.floor(value)}+`;
}

/**
 * Counts active customers (users with 'active' or 'trialing' subscription status)
 */
export function countActiveCustomers(users: Array<{ subscription_status: string }>): number {
  return users.filter(
    user => user.subscription_status === 'active' || user.subscription_status === 'trialing'
  ).length;
}

/**
 * Gets sent articles count directly from Google Sheets
 * This is the source of truth - always fetch from sheets for accurate landing page stats
 */
async function getSentArticlesCount(): Promise<number> {
  // Always fetch from Google Sheets for accurate count
  // The sheets contain ALL customer data, including those not in the database
  return await getSentArticlesFromSheets();
}

/**
 * Fetches sent articles count from ALL sheets in the Customers spreadsheet
 * This ensures we count articles from all customer sheets, not just those in the database
 */
async function getSentArticlesFromSheets(): Promise<number> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID;

  if (!spreadsheetId) {
    console.warn('GOOGLE_SHEETS_CUSTOMER_CONFIG_ID not configured');
    return 0;
  }

  try {
    const auth = getGoogleAuth(['https://www.googleapis.com/auth/spreadsheets.readonly']);
    const sheets = google.sheets({ version: 'v4', auth });

    // Get ALL sheet names from the spreadsheet
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    });

    const sheetNames =
      spreadsheetInfo.data.sheets?.map(sheet => sheet.properties?.title).filter(Boolean) || [];

    if (sheetNames.length === 0) {
      console.warn('No sheets found in Customers spreadsheet');
      return 0;
    }

    let totalSent = 0;

    // Fetch sent count from each sheet in the spreadsheet
    for (const sheetName of sheetNames) {
      if (!sheetName) continue;

      // Skip common non-customer sheets (like main config sheet)
      const lowerName = sheetName.toLowerCase();
      if (
        lowerName === 'main' ||
        lowerName === 'config' ||
        lowerName === 'settings' ||
        lowerName === 'template'
      ) {
        continue;
      }

      // Escape sheet name for use in ranges
      const escapedSheetName =
        sheetName.includes(' ') || sheetName.includes("'")
          ? `'${sheetName.replace(/'/g, "''")}'`
          : sheetName;

      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${escapedSheetName}!B2:B`, // Column B is status
        });

        const rows = response.data.values || [];
        const sentCount = rows.filter(
          row => row[0] && row[0].toString().toLowerCase() === 'sent'
        ).length;
        totalSent += sentCount;
      } catch (sheetError) {
        // Sheet might have different structure, skip it
        console.warn(`Could not read sheet "${sheetName}":`, sheetError);
      }
    }

    return totalSent;
  } catch (error) {
    console.error('Error fetching sent articles from sheets:', error);
    return 0;
  }
}

/**
 * Gets landing page statistics from Google Sheets (source of truth)
 */
export async function getLandingStats(): Promise<LandingStats> {
  const supabase = getSupabaseAdmin();

  try {
    // Get sent articles count directly from Google Sheets (source of truth)
    const articlesSent = await getSentArticlesCount();

    // Get active customers count
    const { count: activeCustomers, error: usersError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .in('subscription_status', ['active', 'trialing']);

    if (usersError) {
      console.error('Error fetching users for landing stats:', usersError);
      return getDefaultStats();
    }

    const customersCount = activeCustomers || 0;

    return {
      articlesSent,
      activeCustomers: customersCount,
      formattedArticles: formatStatNumber(articlesSent),
      formattedCustomers: formatStatNumber(customersCount),
    };
  } catch (error) {
    console.error('Error getting landing stats:', error);
    return getDefaultStats();
  }
}

/**
 * Returns default/fallback statistics when data cannot be fetched
 */
function getDefaultStats(): LandingStats {
  return {
    articlesSent: 0,
    activeCustomers: 0,
    formattedArticles: '0+',
    formattedCustomers: '0+',
  };
}
