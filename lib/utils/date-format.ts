/**
 * Date formatting utilities
 * Separated from google-sheets.ts to avoid importing googleapis in client components
 */

/**
 * Format date as YYYY-MM-DD for Google Sheets
 * This ISO format is universally recognized and avoids locale issues.
 *
 * The function ensures:
 * 1. Valid date parsing from string or Date object
 * 2. Proper YYYY-MM-DD format output
 * 3. Invalid dates default to current date
 */
export function formatDateForSheets(date: Date | string): string {
  let d: Date;

  if (typeof date === 'string') {
    d = new Date(date);
  } else {
    d = date;
  }

  // Validate the date - if invalid, use current date
  if (isNaN(d.getTime())) {
    console.warn('[formatDateForSheets] Invalid date provided, using current date');
    d = new Date();
  }

  // Use toISOString and extract just the date part (YYYY-MM-DD)
  // This ensures consistent formatting without any prefix
  return d.toISOString().split('T')[0];
}
