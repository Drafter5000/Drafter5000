/**
 * Onboarding Row Serialization Utilities
 *
 * Provides functions to serialize onboarding data to Google Sheets row format
 * and deserialize rows back to structured data objects.
 */

/**
 * Column order constants for Google Sheets row format
 * Matches the design document specification:
 * A: Email, B: Display Name, C: Created At, D: Preferred Language,
 * E: Delivery Days, F: Status, G: Style Samples, H: Subjects
 */
export const COLUMN_ORDER = {
  EMAIL: 0,
  DISPLAY_NAME: 1,
  CREATED_AT: 2,
  PREFERRED_LANGUAGE: 3,
  DELIVERY_DAYS: 4,
  STATUS: 5,
  STYLE_SAMPLES: 6,
  SUBJECTS: 7,
} as const;

export const TOTAL_COLUMNS = 8;

/**
 * Separator used for joining array fields in serialized rows
 */
export const ARRAY_SEPARATOR = ',';

/**
 * Represents the complete onboarding data structure for Google Sheets row serialization
 */
export interface OnboardingRowData {
  email: string;
  display_name: string;
  created_at: string;
  preferred_language: string;
  delivery_days: string[];
  status: 'active' | 'paused';
  style_samples: string[];
  subjects: string[];
}

/**
 * Serializes an OnboardingRowData object to an array of cell values
 * for appending to Google Sheets.
 *
 * @param data - The onboarding data to serialize
 * @returns An array of 8 string values in the defined column order
 *
 * Requirements: 5.1, 5.2
 */
export function serializeToRow(data: OnboardingRowData): string[] {
  return [
    data.email,
    data.display_name,
    data.created_at,
    data.preferred_language,
    data.delivery_days.join(ARRAY_SEPARATOR),
    data.status,
    data.style_samples.join(ARRAY_SEPARATOR),
    data.subjects.join(ARRAY_SEPARATOR),
  ];
}

/**
 * Deserializes a Google Sheets row array back into an OnboardingRowData object.
 *
 * @param row - An array of 8 string values from Google Sheets
 * @returns The parsed OnboardingRowData object
 * @throws Error if the row does not have exactly 8 elements
 *
 * Requirements: 5.3
 */
export function deserializeFromRow(row: string[]): OnboardingRowData {
  if (row.length !== TOTAL_COLUMNS) {
    throw new Error(`Invalid row length: expected ${TOTAL_COLUMNS} columns, got ${row.length}`);
  }

  const status = row[COLUMN_ORDER.STATUS];
  if (status !== 'active' && status !== 'paused') {
    throw new Error(`Invalid status value: expected 'active' or 'paused', got '${status}'`);
  }

  return {
    email: row[COLUMN_ORDER.EMAIL],
    display_name: row[COLUMN_ORDER.DISPLAY_NAME],
    created_at: row[COLUMN_ORDER.CREATED_AT],
    preferred_language: row[COLUMN_ORDER.PREFERRED_LANGUAGE],
    delivery_days: parseArrayField(row[COLUMN_ORDER.DELIVERY_DAYS]),
    status: status,
    style_samples: parseArrayField(row[COLUMN_ORDER.STYLE_SAMPLES]),
    subjects: parseArrayField(row[COLUMN_ORDER.SUBJECTS]),
  };
}

/**
 * Parses a comma-separated string into an array of strings.
 * Handles empty strings by returning an empty array.
 * Preserves empty string elements within arrays (e.g., "a,,b" -> ["a", "", "b"])
 *
 * @param value - The comma-separated string to parse
 * @returns An array of strings
 */
function parseArrayField(value: string): string[] {
  // Only return empty array if the value is completely empty
  // This distinguishes between "" (no elements) and "," (elements that happen to be empty)
  if (value === '') {
    return [];
  }
  return value.split(ARRAY_SEPARATOR);
}
