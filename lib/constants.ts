/**
 * Shared constants for the application
 */
export interface Language {
  code: string;
  label: string;
  flag: string;
}

export interface Day {
  id: DayCode;
  label: string;
  short: string;
}

export type DayCode = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/**
 * Supported languages for article generation
 * Currently limited to English and French only
 */
export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
];

/**
 * Days of the week for delivery scheduling
 */
export const DAYS: Day[] = [
  { id: 'mon', label: 'Monday', short: 'Mon' },
  { id: 'tue', label: 'Tuesday', short: 'Tue' },
  { id: 'wed', label: 'Wednesday', short: 'Wed' },
  { id: 'thu', label: 'Thursday', short: 'Thu' },
  { id: 'fri', label: 'Friday', short: 'Fri' },
  { id: 'sat', label: 'Saturday', short: 'Sat' },
  { id: 'sun', label: 'Sunday', short: 'Sun' },
];

/**
 * Default delivery days (weekdays) for new users
 */
export const DEFAULT_DELIVERY_DAYS: DayCode[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

/**
 * Get language info by code
 */
export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get day info by id
 */
export function getDayById(id: DayCode): Day | undefined {
  return DAYS.find(day => day.id === id);
}
