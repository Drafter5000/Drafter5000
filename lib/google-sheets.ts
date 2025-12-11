import { google } from 'googleapis';

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

/**
 * Get Google Auth instance with proper credentials handling.
 * Supports both JSON credentials (for Vercel/production) and file path (for local dev).
 * @param scopes - OAuth scopes to request (defaults to spreadsheets)
 */
export function getGoogleAuth(scopes: string[] = ['https://www.googleapis.com/auth/spreadsheets']) {
  const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

  // Prefer JSON credentials (for Vercel/production), fall back to file path (for local dev)
  if (credentialsJson) {
    console.log('[GoogleSheets] Using GOOGLE_CREDENTIALS_JSON (environment variable)');
    try {
      const credentials = JSON.parse(credentialsJson);
      return new google.auth.GoogleAuth({
        credentials,
        scopes,
      });
    } catch (error) {
      console.error('[GoogleSheets] Failed to parse GOOGLE_CREDENTIALS_JSON:', error);
      throw new Error('Invalid GOOGLE_CREDENTIALS_JSON format');
    }
  }

  if (credentialsPath) {
    console.log('[GoogleSheets] Using GOOGLE_CREDENTIALS_PATH (file):', credentialsPath);
    return new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes,
    });
  }

  console.error(
    '[GoogleSheets] Neither GOOGLE_CREDENTIALS_JSON nor GOOGLE_CREDENTIALS_PATH configured!'
  );
  throw new Error('Google credentials not configured');
}

export async function getGoogleSheetsClient() {
  if (sheetsClient) {
    console.log('[GoogleSheets] Using cached sheets client');
    return sheetsClient;
  }

  console.log('[GoogleSheets] Creating new sheets client...');
  const auth = getGoogleAuth();
  sheetsClient = google.sheets({ version: 'v4', auth });
  console.log('[GoogleSheets] Sheets client created');
  return sheetsClient;
}

// Main Sheet columns (18 columns: A-R)
export interface MainSheetRowData {
  sheetName: string;
  customerName: string;
  customerEmail: string;
  customerJob: string;
  language: string;
  emailMonday: boolean;
  emailTuesday: boolean;
  emailWednesday: boolean;
  emailThursday: boolean;
  emailFriday: boolean;
  emailSaturday: boolean;
  emailSunday: boolean;
  paywallStatus: string;
  endOfMembership: string;
  customerSheetCreated: string;
  article1Example: string;
  article2Example: string;
  article3Example: string;
}

// Customers sheet columns (6 columns: A-F)
export interface CustomersSheetRowData {
  question: string;
  status: string;
  subject: string;
  article: string;
  lastUpdate: string;
  client: string;
}

// Main Sheet name - can be configured via env var
const MAIN_SHEET_NAME = process.env.GOOGLE_SHEETS_MAIN_SHEET_NAME;

// Get the first sheet name from the spreadsheet
async function getFirstSheetName(spreadsheetId: string): Promise<string> {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });

  const firstSheet = response.data.sheets?.[0]?.properties?.title;
  if (!firstSheet) {
    throw new Error('No sheets found in spreadsheet');
  }
  return firstSheet;
}

// Check if email already exists in main sheet (column C)
async function emailExistsInMainSheet(
  spreadsheetId: string,
  sheetName: string,
  email: string
): Promise<boolean> {
  if (!email) return false;

  const sheets = await getGoogleSheetsClient();
  const sheetRef = sheetName.includes(' ') ? `'${sheetName}'` : sheetName;

  try {
    // Get all emails from column C (customerEmail)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetRef}!C:C`,
    });

    const rows = response.data.values || [];
    const emailLower = email.toLowerCase();

    // Check if email exists (case-insensitive)
    for (const row of rows) {
      if (row[0] && row[0].toString().toLowerCase() === emailLower) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('[GoogleSheets] Error checking for existing email:', error);
    return false; // If we can't check, allow the append
  }
}

// Append to Main Sheet (customer config - 18 columns: A-R)
// Will NOT add duplicate rows for the same email
export async function appendToMainSheet(spreadsheetId: string, data: MainSheetRowData) {
  console.log('[GoogleSheets] appendToMainSheet called');
  console.log('[GoogleSheets] Spreadsheet ID:', spreadsheetId);
  console.log('[GoogleSheets] Customer Email:', data.customerEmail);

  const sheets = await getGoogleSheetsClient();

  // Get sheet name from env or auto-detect first sheet
  console.log('[GoogleSheets] MAIN_SHEET_NAME env:', MAIN_SHEET_NAME);
  const sheetName = MAIN_SHEET_NAME || (await getFirstSheetName(spreadsheetId));
  console.log('[GoogleSheets] Using sheet name:', sheetName);

  // Check if email already exists in the sheet
  const emailExists = await emailExistsInMainSheet(spreadsheetId, sheetName, data.customerEmail);
  if (emailExists) {
    console.log(
      `[GoogleSheets] Email "${data.customerEmail}" already exists in main sheet, skipping append`
    );
    return { data: {}, skipped: true };
  }

  // Wrap sheet name in quotes if it contains spaces
  const sheetRef = sheetName.includes(' ') ? `'${sheetName}'` : sheetName;
  const range = `${sheetRef}!A1`;
  console.log('[GoogleSheets] Range:', range);

  const rowValues = [
    data.sheetName,
    data.customerName,
    data.customerEmail,
    data.customerJob,
    data.language,
    data.emailMonday ? 'x' : '',
    data.emailTuesday ? 'x' : '',
    data.emailWednesday ? 'x' : '',
    data.emailThursday ? 'x' : '',
    data.emailFriday ? 'x' : '',
    data.emailSaturday ? 'x' : '',
    data.emailSunday ? 'x' : '',
    data.paywallStatus,
    data.endOfMembership,
    data.customerSheetCreated,
    data.article1Example,
    data.article2Example,
    data.article3Example,
  ];
  console.log('[GoogleSheets] Row values:', JSON.stringify(rowValues));

  try {
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowValues],
      },
    });

    console.log(
      '[GoogleSheets] Append successful, updated range:',
      result.data.updates?.updatedRange
    );
    return result;
  } catch (error) {
    console.error('[GoogleSheets] Append failed:', error);
    console.error(
      '[GoogleSheets] Error details:',
      error instanceof Error ? error.stack : String(error)
    );
    throw error;
  }
}

// Append to Customers sheet (6 columns)
export async function appendToCustomersSheet(spreadsheetId: string, data: CustomersSheetRowData) {
  const sheets = await getGoogleSheetsClient();

  const result = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Customers!A:F',
    valueInputOption: 'RAW',
    requestBody: {
      values: [
        [data.question, data.status, data.subject, data.article, data.lastUpdate, data.client],
      ],
    },
  });

  return result;
}

export async function createCustomerSheet(
  spreadsheetId: string,
  sheetName: string,
  headerRow: string[]
) {
  console.log('[GoogleSheets] createCustomerSheet called');
  console.log('[GoogleSheets] Sheet name:', sheetName);
  console.log('[GoogleSheets] Header row:', headerRow);

  const sheets = await getGoogleSheetsClient();

  // Escape sheet name for use in ranges (wrap in quotes if contains special chars)
  const escapedSheetName =
    sheetName.includes(' ') || sheetName.includes("'")
      ? `'${sheetName.replace(/'/g, "''")}'`
      : sheetName;

  console.log('[GoogleSheets] Escaped sheet name:', escapedSheetName);

  try {
    // First create the sheet
    console.log('[GoogleSheets] Creating new sheet...');
    const addSheetResult = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: {
                  rowCount: 100,
                  columnCount: 8,
                },
              },
            },
          },
        ],
      },
    });

    // Then add headers
    const newSheetId = addSheetResult.data.replies?.[0]?.addSheet?.properties?.sheetId;
    console.log('[GoogleSheets] New sheet ID:', newSheetId);

    if (newSheetId !== undefined) {
      console.log('[GoogleSheets] Adding headers to new sheet...');
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${escapedSheetName}!A1:H1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headerRow],
        },
      });
      console.log('[GoogleSheets] Headers added successfully');
    }

    return newSheetId;
  } catch (error: unknown) {
    // Check if sheet already exists
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('[GoogleSheets] Create sheet error:', errorMessage);

    if (errorMessage.includes('already exists')) {
      console.log(`[GoogleSheets] Sheet "${sheetName}" already exists, skipping creation`);
      return null;
    }
    console.error('[GoogleSheets] Create sheet failed:', error);
    throw error;
  }
}
