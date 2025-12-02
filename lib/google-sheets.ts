import { google } from "googleapis"

let sheetsClient: ReturnType<typeof google.sheets> | null = null

function getGoogleAuth() {
  return new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })
}

export async function getGoogleSheetsClient() {
  if (sheetsClient) return sheetsClient

  const auth = getGoogleAuth()
  sheetsClient = google.sheets({ version: "v4", auth })
  return sheetsClient
}

export interface SheetRowData {
  email: string
  display_name: string
  created_at: string
  preferred_language: string
  delivery_days: string
  status: "active" | "paused"
}

export async function appendCustomerToSheet(spreadsheetId: string, sheetName: string, data: SheetRowData) {
  const sheets = await getGoogleSheetsClient()

  const result = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:G`,
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          data.email,
          data.display_name,
          data.created_at,
          data.preferred_language,
          data.delivery_days,
          data.status,
          "", // placeholder for generated articles
        ],
      ],
    },
  })

  return result
}

export async function createCustomerSheet(spreadsheetId: string, sheetName: string, headerRow: string[]) {
  const sheets = await getGoogleSheetsClient()

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
  })

  // Then add headers
  const newSheetId = addSheetResult.data.replies?.[0]?.addSheet?.properties?.sheetId

  if (newSheetId !== undefined) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1:H1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headerRow],
      },
    })
  }

  return newSheetId
}
