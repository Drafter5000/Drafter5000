/**
 * Date formatting utilities
 * Separated from google-sheets.ts to avoid importing googleapis in client components
 */

/**
 * Format date as YYYY-MM-DD for Google Sheets
 * This ISO format is universally recognized and avoids locale issues
 */
export function formatDateForSheets(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
