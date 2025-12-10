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
 * Used across step 3 forms and settings pages
 */
export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', label: 'Polish', flag: '🇵🇱' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
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
