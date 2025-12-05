import { google } from 'googleapis';

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

function getGoogleAuth() {
  return new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function getGoogleSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const auth = getGoogleAuth();
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

// Main Sheet columns (16 columns: A-P)
export interface MainSheetRowData {
  sheetName: string;
  customerName: string;
  customerEmail: string;
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

// Main Sheet name - can be configured via env var or defaults to "Main Sheet"
const MAIN_SHEET_NAME = process.env.GOOGLE_SHEETS_MAIN_SHEET_NAME || 'Sheet1';

// Append to Main Sheet (customer config - 16 columns: A-P)
export async function appendToMainSheet(spreadsheetId: string, data: MainSheetRowData) {
  const sheets = await getGoogleSheetsClient();

  // 16 columns (A-P): Sheet Name, Customer Name, Customer Email, Language,
  // Email Monday-Sunday (7), Paywall Status, End of membership,
  // Customer Sheet Created, Article 1-3 Example
  // Wrap sheet name in quotes if it contains spaces
  const sheetRef = MAIN_SHEET_NAME.includes(' ') ? `'${MAIN_SHEET_NAME}'` : MAIN_SHEET_NAME;
  const range = `${sheetRef}!A1`;

  const result = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [
        [
          data.sheetName,
          data.customerName,
          data.customerEmail,
          data.language,
          data.emailMonday ? 'Yes' : 'No',
          data.emailTuesday ? 'Yes' : 'No',
          data.emailWednesday ? 'Yes' : 'No',
          data.emailThursday ? 'Yes' : 'No',
          data.emailFriday ? 'Yes' : 'No',
          data.emailSaturday ? 'Yes' : 'No',
          data.emailSunday ? 'Yes' : 'No',
          data.paywallStatus,
          data.endOfMembership,
          data.customerSheetCreated,
          data.article1Example,
          data.article2Example,
          data.article3Example,
        ],
      ],
    },
  });

  return result;
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
  const sheets = await getGoogleSheetsClient();

  // First create the sheet
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

  if (newSheetId !== undefined) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1:H1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headerRow],
      },
    });
  }

  return newSheetId;
}
