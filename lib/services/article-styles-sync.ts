import { appendToMainSheet, createCustomerSheet, getGoogleAuth } from '@/lib/google-sheets';
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
 * Format date as MM/DD/YYYY for Google Sheets
 * Using this format ensures Google Sheets recognizes it as a date
 * and doesn't add a leading apostrophe
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
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

    // Credentials are handled by getGoogleAuth() - supports both JSON and file path

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
      customerJob: userJob || '',
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

          const auth = getGoogleAuth();
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
              '', // Subject - '' initially
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
                valueInputOption: 'USER_ENTERED',
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
  console.log('=== UPDATE STYLE IN SHEETS START ===');
  console.log('Style ID:', style.id);
  console.log('Style email:', style.email);
  console.log('Style subjects:', style.subjects?.length || 0);
  console.log('Style samples:', style.style_samples?.length || 0);

  try {
    const customersSpreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID;
    const mainSpreadsheetId = process.env.GOOGLE_SHEETS_ARTICLES_ID;
    const mainSheetName = process.env.GOOGLE_SHEETS_MAIN_SHEET_NAME || 'Sheet1';

    console.log('Customers spreadsheet ID:', customersSpreadsheetId ? 'SET' : 'NOT SET');
    console.log('Main spreadsheet ID:', mainSpreadsheetId ? 'SET' : 'NOT SET');
    console.log('Main sheet name:', mainSheetName);

    if (!mainSpreadsheetId && !customersSpreadsheetId) {
      console.warn('No Google Sheets configured, skipping sync');
      return { success: true };
    }

    // Fetch job from user_profiles
    const supabase = await getServerSupabaseClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('job')
      .eq('id', style.user_id)
      .single();
    const userJob = profile?.job || '';
    console.log('User job from profile:', userJob);

    const customerSheetName = style.display_name || style.name || style.user_id;
    const escapedCustomerSheetName =
      customerSheetName.includes(' ') || customerSheetName.includes("'")
        ? `'${customerSheetName.replace(/'/g, "''")}'`
        : customerSheetName;

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Escape main sheet name for use in ranges
    const escapedMainSheetName =
      mainSheetName.includes(' ') || mainSheetName.includes("'")
        ? `'${mainSheetName.replace(/'/g, "''")}'`
        : mainSheetName;

    // Update main sheet with all fields if main spreadsheet is configured
    if (mainSpreadsheetId && style.email) {
      try {
        console.log('=== UPDATING MAIN SHEET ===');
        console.log('Using sheet name:', escapedMainSheetName);

        // Find the row with this email in the main sheet
        const mainSheetData = await sheets.spreadsheets.values.get({
          spreadsheetId: mainSpreadsheetId,
          range: `${escapedMainSheetName}!A:Z`, // Columns A through Z to capture all possible columns
        });

        const rows = mainSheetData.data.values || [];
        const headerRow = rows[0] || [];
        console.log('Main sheet headers:', headerRow);

        // Find column indices (case-insensitive, supports multiple possible names)
        const findColIndex = (...names: string[]) => {
          for (const name of names) {
            const idx = headerRow.findIndex(
              (h: string) => h?.toLowerCase().trim() === name.toLowerCase()
            );
            if (idx >= 0) return idx;
          }
          return -1;
        };

        const emailColIndex = findColIndex('customer email', 'email');
        // Job column - try multiple possible header names, or use last column (R = index 17)
        let jobColIndex = findColIndex('customer job', 'job', 'job title');
        // If job column not found by name, check if column R (index 17) exists and use it
        if (jobColIndex < 0 && headerRow.length >= 18) {
          console.log('Job column not found by name, using column R (index 17) as fallback');
          jobColIndex = 17;
        }
        const article1ColIndex = findColIndex('article 1 example', 'article1', 'article 1');
        const article2ColIndex = findColIndex('article 2 example', 'article2', 'article 2');
        const article3ColIndex = findColIndex('article 3 example', 'article3', 'article 3');
        const languageColIndex = findColIndex('language');
        const mondayColIndex = findColIndex('email monday', 'monday');
        const tuesdayColIndex = findColIndex('email tuesday', 'tuesday');
        const wednesdayColIndex = findColIndex('email wednesday', 'wednesday');
        const thursdayColIndex = findColIndex('email thursday', 'thursday');
        const fridayColIndex = findColIndex('email friday', 'friday');
        const saturdayColIndex = findColIndex('email saturday', 'saturday');
        const sundayColIndex = findColIndex('email sunday', 'sunday');

        console.log('Column indices:', {
          email: emailColIndex,
          job: jobColIndex,
          article1: article1ColIndex,
          article2: article2ColIndex,
          article3: article3ColIndex,
          language: languageColIndex,
          monday: mondayColIndex,
          tuesday: tuesdayColIndex,
          wednesday: wednesdayColIndex,
          thursday: thursdayColIndex,
          friday: fridayColIndex,
          saturday: saturdayColIndex,
          sunday: sundayColIndex,
        });

        if (emailColIndex >= 0) {
          // Find the row with matching email
          const rowIndex = rows.findIndex(
            (row: string[], idx: number) =>
              idx > 0 && row[emailColIndex]?.toLowerCase() === style.email?.toLowerCase()
          );

          console.log('Found row index:', rowIndex, 'for email:', style.email);

          if (rowIndex > 0) {
            const rowNum = rowIndex + 1; // 1-based row number for sheets API

            // Helper function to get column letter (supports columns beyond Z)
            const getColLetter = (index: number): string => {
              if (index < 26) return String.fromCharCode(65 + index);
              return (
                String.fromCharCode(64 + Math.floor(index / 26)) +
                String.fromCharCode(65 + (index % 26))
              );
            };

            // Update job title if column exists
            if (jobColIndex >= 0) {
              const cell = `${escapedMainSheetName}!${getColLetter(jobColIndex)}${rowNum}`;
              await sheets.spreadsheets.values.update({
                spreadsheetId: mainSpreadsheetId,
                range: cell,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[userJob || '']] },
              });
              console.log(`Updated job title: "${userJob}" at ${cell}`);
            }

            // Update article samples
            if (article1ColIndex >= 0) {
              const cell = `${escapedMainSheetName}!${getColLetter(article1ColIndex)}${rowNum}`;
              await sheets.spreadsheets.values.update({
                spreadsheetId: mainSpreadsheetId,
                range: cell,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[style.style_samples[0] || '']] },
              });
              console.log(`Updated article 1 at ${cell}`);
            }
            if (article2ColIndex >= 0) {
              const cell = `${escapedMainSheetName}!${getColLetter(article2ColIndex)}${rowNum}`;
              await sheets.spreadsheets.values.update({
                spreadsheetId: mainSpreadsheetId,
                range: cell,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[style.style_samples[1] || '']] },
              });
              console.log(`Updated article 2 at ${cell}`);
            }
            if (article3ColIndex >= 0) {
              const cell = `${escapedMainSheetName}!${getColLetter(article3ColIndex)}${rowNum}`;
              await sheets.spreadsheets.values.update({
                spreadsheetId: mainSpreadsheetId,
                range: cell,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[style.style_samples[2] || '']] },
              });
              console.log(`Updated article 3 at ${cell}`);
            }

            // Update language
            if (languageColIndex >= 0) {
              const cell = `${escapedMainSheetName}!${getColLetter(languageColIndex)}${rowNum}`;
              await sheets.spreadsheets.values.update({
                spreadsheetId: mainSpreadsheetId,
                range: cell,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[getLanguageName(style.preferred_language)]] },
              });
              console.log(
                `Updated language: "${getLanguageName(style.preferred_language)}" at ${cell}`
              );
            }

            // Update delivery days (interval)
            const deliveryDays = style.delivery_days || [];
            const dayUpdates = [
              { col: mondayColIndex, day: 'mon', name: 'Monday' },
              { col: tuesdayColIndex, day: 'tue', name: 'Tuesday' },
              { col: wednesdayColIndex, day: 'wed', name: 'Wednesday' },
              { col: thursdayColIndex, day: 'thu', name: 'Thursday' },
              { col: fridayColIndex, day: 'fri', name: 'Friday' },
              { col: saturdayColIndex, day: 'sat', name: 'Saturday' },
              { col: sundayColIndex, day: 'sun', name: 'Sunday' },
            ];

            for (const { col, day, name } of dayUpdates) {
              if (col >= 0) {
                const cell = `${escapedMainSheetName}!${getColLetter(col)}${rowNum}`;
                const value = deliveryDays.includes(day) ? 'x' : '';
                await sheets.spreadsheets.values.update({
                  spreadsheetId: mainSpreadsheetId,
                  range: cell,
                  valueInputOption: 'USER_ENTERED',
                  requestBody: { values: [[value]] },
                });
                console.log(`Updated ${name}: ${value ? 'x' : '(empty)'} at ${cell}`);
              }
            }

            console.log(`Successfully updated all fields in main sheet row ${rowNum}`);
          } else {
            console.log('No matching row found for email:', style.email);
          }
        } else {
          console.log('Customer email column not found in main sheet');
        }
      } catch (mainSheetError) {
        console.error('Could not update main sheet:', mainSheetError);
        // Continue with customer sheet sync even if main sheet update fails
      }
    }

    // Update customer sheet with topics if customers spreadsheet is configured
    if (customersSpreadsheetId) {
      try {
        console.log('=== UPDATING CUSTOMER SHEET ===');
        console.log('Customer sheet name:', customerSheetName);

        // Get the sheet ID for deletion operations
        const spreadsheetMeta = await sheets.spreadsheets.get({
          spreadsheetId: customersSpreadsheetId,
          fields: 'sheets.properties',
        });
        const customerSheet = spreadsheetMeta.data.sheets?.find(
          s => s.properties?.title === customerSheetName
        );
        const sheetId = customerSheet?.properties?.sheetId;

        if (!sheetId && sheetId !== 0) {
          console.log('Customer sheet not found, skipping topic sync');
        } else {
          // Get existing topics from the customer sheet with row data
          const existingData = await sheets.spreadsheets.values.get({
            spreadsheetId: customersSpreadsheetId,
            range: `${escapedCustomerSheetName}!A:F`,
          });
          const rows = existingData.data.values || [];
          console.log('Total rows in sheet:', rows.length);

          // Build map of existing topics (skip header row)
          const existingTopicsMap: Map<string, number> = new Map();
          for (let i = 1; i < rows.length; i++) {
            const topic = rows[i]?.[0];
            if (topic && topic !== 'Topic') {
              existingTopicsMap.set(topic.toLowerCase(), i);
            }
          }
          console.log('Existing topics count:', existingTopicsMap.size);

          const styleSubjectsLower = (style.subjects || []).map((s: string) => s.toLowerCase());

          // Find topics to DELETE (exist in sheet but not in style.subjects)
          const rowsToDelete: number[] = [];
          for (const [topic, rowIndex] of existingTopicsMap) {
            if (!styleSubjectsLower.includes(topic)) {
              rowsToDelete.push(rowIndex);
            }
          }

          // Delete rows in reverse order (to avoid index shifting issues)
          if (rowsToDelete.length > 0) {
            console.log(`Deleting ${rowsToDelete.length} topics from sheet`);
            rowsToDelete.sort((a, b) => b - a); // Sort descending

            for (const rowIndex of rowsToDelete) {
              await sheets.spreadsheets.batchUpdate({
                spreadsheetId: customersSpreadsheetId,
                requestBody: {
                  requests: [
                    {
                      deleteDimension: {
                        range: {
                          sheetId: sheetId,
                          dimension: 'ROWS',
                          startIndex: rowIndex,
                          endIndex: rowIndex + 1,
                        },
                      },
                    },
                  ],
                },
              });
            }
            console.log(`Deleted ${rowsToDelete.length} topics from sheet`);
          }

          // Find NEW topics to add (exist in style.subjects but not in sheet)
          const existingTopicsLower = Array.from(existingTopicsMap.keys());
          const newSubjects = (style.subjects || []).filter(
            (subject: string) => !existingTopicsLower.includes(subject.toLowerCase())
          );

          console.log(
            `New topics to add: ${newSubjects.length} (filtered from ${style.subjects?.length || 0})`
          );

          if (newSubjects.length > 0) {
            const clientName = style.display_name || style.name || '';
            const currentDate = formatDate(new Date());

            const topicRows = newSubjects.map((subject: string) => [
              subject,
              'Needs Draft',
              '',
              '',
              currentDate,
              clientName,
            ]);

            await sheets.spreadsheets.values.append({
              spreadsheetId: customersSpreadsheetId,
              range: `${escapedCustomerSheetName}!A2`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: topicRows,
              },
            });

            console.log(`Added ${newSubjects.length} new topics to sheet: ${customerSheetName}`);
          } else {
            console.log('No new topics to add');
          }
        }
      } catch (customerSheetError) {
        console.error('Could not update customer sheet:', customerSheetError);
      }
    }

    console.log('=== UPDATE STYLE IN SHEETS SUCCESS ===');
    console.log(`Style ${style.id} synced to Google Sheets`);
    return { success: true };
  } catch (error) {
    console.error('=== UPDATE STYLE IN SHEETS FAILED ===');
    console.error('Failed to update style in Google Sheets:', error);
    console.error('Error details:', error instanceof Error ? error.stack : String(error));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
