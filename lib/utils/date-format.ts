/**
 * Date formatting utilities
 * Separated from google-sheets.ts to avoid importing googleapis in client components
 */

/**
 * Format date as YYYY-MM-DD for Google Sheets
 * This ISO format is universally recognized and avoids locale issues
 *
 * Note: When using USER_ENTERED value input option, Google Sheets may convert
 * date strings to serial numbers (days since Dec 30, 1899). To prevent this,
 * we prefix with an apostrophe to force text format, which displays the date
 * as a readable string rather than a number like "46040".
 */
export function formatDateForSheets(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  // Prefix with apostrophe to force text format and prevent serial number conversion
  return `'${year}-${month}-${day}`;
}
