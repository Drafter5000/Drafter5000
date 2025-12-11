import { appendToMainSheet, createCustomerSheet } from '@/lib/google-sheets';
import { getServerSupabaseClient } from '@/lib/supabase-client';
import type { ArticleStyle } from '@/lib/types';
import Stripe from 'stripe';
import { google } from 'googleapis';

export interface SyncResult {
  success: boolean;
  sheetsConfigId?: string;
  sheetsRowId?: string;
  error?: string;
}

/**
 * Language code to full name mapping
 */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
};

/**
 * Get the full language name from a language code
 */
function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the subscription end date for a user
 */
async function getSubscriptionEndDate(userId: string): Promise<string> {
  try {
    const supabase = await getServerSupabaseClient();

    // Get user's Stripe customer ID and subscription status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, subscription_status, subscription_plan')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      // No Stripe customer, return empty
      return '';
    }

    // If user is on free plan, no end date
    if (profile.subscription_plan === 'free') {
      return '';
    }

    // Get subscription details from Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.warn('STRIPE_SECRET_KEY not configured');
      return '';
    }

    const stripe = new Stripe(stripeSecretKey);

    // List active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return '';
    }

    const subscription = subscriptions.data[0];

    // Get the current period end date
    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end * 1000);
      return formatDate(endDate);
    }

    return '';
  } catch (error) {
    console.error('Failed to get subscription end date:', error);
    return '';
  }
}

export async function syncStyleToSheets(
  style: ArticleStyle,
  userJob?: string
): Promise<SyncResult> {
  console.log('=== GOOGLE SHEETS SYNC START ===');
  console.log('Style ID:', style.id);
  console.log('User ID:', style.user_id);
  console.log('Display Name:', style.display_name);
  console.log('Email:', style.email);
  console.log('Job:', userJob);
  console.log('Subjects:', JSON.stringify(style.subjects));
  console.log('Delivery Days:', JSON.stringify(style.delivery_days));
  console.log('Preferred Language:', style.preferred_language);

  // Check environment variables
  console.log('=== ENVIRONMENT CHECK ===');
  console.log(
    'GOOGLE_SHEETS_ARTICLES_ID (Main):',
    process.env.GOOGLE_SHEETS_ARTICLES_ID ? 'SET' : 'NOT SET'
  );
  console.log(
    'GOOGLE_SHEETS_CUSTOMER_CONFIG_ID (Customers):',
    process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID ? 'SET' : 'NOT SET'
  );
  console.log('GOOGLE_CREDENTIALS_PATH:', process.env.GOOGLE_CREDENTIALS_PATH ? 'SET' : 'NOT SET');

  try {
    // Main spreadsheet for the overview/config sheet
    const mainSpreadsheetId = process.env.GOOGLE_SHEETS_ARTICLES_ID;
    // Separate Customers spreadsheet for individual customer sheets (tabs)
    const customersSpreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID;

    console.log('Main Spreadsheet ID configured:', !!mainSpreadsheetId);
    console.log('Customers Spreadsheet ID configured:', !!customersSpreadsheetId);

    if (!mainSpreadsheetId) {
      console.warn('GOOGLE_SHEETS_ARTICLES_ID not configured, skipping sync');
      return { success: true };
    }

    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
    if (!credentialsPath) {
      console.error('GOOGLE_CREDENTIALS_PATH not configured!');
      return {
        success: false,
        error: 'Google credentials path not configured',
      };
    }

    console.log('Getting subscription end date...');
    const endOfMembership = await getSubscriptionEndDate(style.user_id);
    console.log('End of membership:', endOfMembership);

    const customerSheetName = `${style.display_name || style.name || style.user_id}`;
    console.log('Customer sheet name:', customerSheetName);

    // Append to Main Sheet (will skip if email already exists)
    console.log('Appending to main sheet...');
    const mainSheetData = {
      sheetName: customerSheetName,
      customerName: style.display_name || style.name || style.user_id,
      customerEmail: style.email || '',
      customerJob: userJob || '',
      language: getLanguageName(style.preferred_language),
      emailMonday: style.delivery_days.includes('mon'),
      emailTuesday: style.delivery_days.includes('tue'),
      emailWednesday: style.delivery_days.includes('wed'),
      emailThursday: style.delivery_days.includes('thu'),
      emailFriday: style.delivery_days.includes('fri'),
      emailSaturday: style.delivery_days.includes('sat'),
      emailSunday: style.delivery_days.includes('sun'),
      paywallStatus: 'Paid',
      endOfMembership,
      customerSheetCreated: 'Yes',
      article1Example: style.style_samples[0] || '',
      article2Example: style.style_samples[1] || '',
      article3Example: style.style_samples[2] || '',
    };
    console.log('Main sheet data:', JSON.stringify(mainSheetData, null, 2));

    const mainSheetResult = await appendToMainSheet(mainSpreadsheetId, mainSheetData);
    if ((mainSheetResult as any).skipped) {
      console.log('Main sheet row already exists for this email, skipped');
    } else {
      console.log('Main sheet append result:', JSON.stringify(mainSheetResult.data, null, 2));
    }

    // Create customer-specific sheet (tab) in the CUSTOMERS spreadsheet
    // This is a separate spreadsheet from the main Articles spreadsheet
    console.log('=== CUSTOMER SHEET CREATION IN CUSTOMERS SPREADSHEET ===');

    if (!customersSpreadsheetId) {
      console.warn(
        'GOOGLE_SHEETS_CUSTOMER_CONFIG_ID not configured, skipping customer sheet creation'
      );
    } else {
      try {
        const headerRow = ['Topic', 'Status', 'Subject', 'Article', 'Last Update', 'Client'];
        console.log('Header row:', headerRow);
        console.log('Creating sheet in Customers spreadsheet:', customersSpreadsheetId);

        // Try to create the sheet (tab) in the Customers spreadsheet
        // This creates a new tab at the bottom with the client name
        const sheetId = await createCustomerSheet(
          customersSpreadsheetId,
          customerSheetName,
          headerRow
        );
        const sheetExists = sheetId === null;
        console.log('Sheet created:', sheetId !== null, '| Sheet already existed:', sheetExists);

        // Add topics from subjects with "Needs Draft" status
        // Columns: Topic | Status | Subject | Article | Last Update | Client
        console.log('=== ADDING TOPICS TO CUSTOMER SHEET ===');
        console.log('Subjects array:', style.subjects);
        console.log('Subjects length:', style.subjects?.length || 0);

        if (style.subjects && style.subjects.length > 0) {
          console.log(`Preparing to add ${style.subjects.length} topics to customer sheet...`);

          const credPath = process.env.GOOGLE_CREDENTIALS_PATH;
          const auth = new google.auth.GoogleAuth({
            keyFile: credPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          });
          const sheets = google.sheets({ version: 'v4', auth });

          // Escape sheet name for use in ranges
          const escapedSheetName =
            customerSheetName.includes(' ') || customerSheetName.includes("'")
              ? `'${customerSheetName.replace(/'/g, "''")}'`
              : customerSheetName;

          // Check if topics already exist in the sheet (in Customers spreadsheet)
          let existingTopics: string[] = [];
          try {
            const existingData = await sheets.spreadsheets.values.get({
              spreadsheetId: customersSpreadsheetId,
              range: `${escapedSheetName}!A:A`,
            });
            existingTopics = (existingData.data.values || [])
              .flat()
              .map((t: string) => t?.toLowerCase?.() || '');
            console.log('Existing topics in sheet:', existingTopics.length);
          } catch (e) {
            console.log('Could not fetch existing topics, will add all');
          }

          const clientName = style.display_name || style.name || '';
          const currentDate = formatDate(new Date());

          // Filter out topics that already exist (case-insensitive)
          const newSubjects = style.subjects.filter(
            (subject: string) => !existingTopics.includes(subject.toLowerCase())
          );

          console.log(
            `New topics to add: ${newSubjects.length} (filtered from ${style.subjects.length})`
          );

          if (newSubjects.length > 0) {
            // Create rows for each NEW topic with "Needs Draft" status
            const topicRows = newSubjects.map((subject: string) => [
              subject, // Topic - the topic/subject text
              'Needs Draft', // Status - default status enum value
              subject, // Subject - same as topic initially
              '', // Article - empty until article is drafted
              currentDate, // Last Update - current date
              clientName, // Client - customer name
            ]);

            console.log('Topic rows to add:', JSON.stringify(topicRows, null, 2));

            try {
              console.log('Calling sheets.spreadsheets.values.append on Customers spreadsheet...');
              const appendResult = await sheets.spreadsheets.values.append({
                spreadsheetId: customersSpreadsheetId,
                range: `${escapedSheetName}!A2`,
                valueInputOption: 'RAW',
                requestBody: {
                  values: topicRows,
                },
              });

              console.log('Topics append SUCCESS!');
              console.log('Updated range:', appendResult.data.updates?.updatedRange);
              console.log(
                `SUCCESS: Added ${topicRows.length} NEW topics with "Needs Draft" status to sheet: ${customerSheetName}`
              );
            } catch (appendError) {
              console.error('Topics append FAILED!');
              console.error('Append error:', appendError);
              throw appendError;
            }
          } else {
            console.log('All topics already exist in sheet, nothing to add');
          }
        } else {
          console.log(
            'No subjects to add to customer sheet - subjects array is empty or undefined'
          );
        }
      } catch (sheetError) {
        // Log but don't fail if customer sheet creation fails
        console.error('=== CUSTOMER SHEET ERROR ===');
        console.error('Failed to create/update customer sheet:', sheetError);
        console.error(
          'Sheet error details:',
          sheetError instanceof Error ? sheetError.stack : String(sheetError)
        );
      }
    }

    console.log('=== GOOGLE SHEETS SYNC SUCCESS ===');
    return {
      success: true,
      sheetsConfigId: mainSpreadsheetId,
    };
  } catch (error) {
    console.error('=== GOOGLE SHEETS SYNC FAILED ===');
    console.error('Failed to sync style to Google Sheets:', error);
    console.error('Error details:', error instanceof Error ? error.stack : String(error));
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
