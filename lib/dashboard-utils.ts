/**
 * Dashboard utility functions for data transformation and display logic
 */

export type ArticleStatus = 'draft' | 'pending' | 'sent';
export type BadgeVariant = 'default' | 'secondary' | 'outline';

/**
 * Maps article status to badge variant for consistent styling
 * - "sent" -> "default" (primary style)
 * - "pending" -> "secondary"
 * - "draft" -> "outline"
 */
export function getStatusBadgeVariant(status: ArticleStatus): BadgeVariant {
  switch (status) {
    case 'sent':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'draft':
      return 'outline';
    default:
      return 'outline';
  }
}

export interface LanguageInfo {
  label: string;
  flag: string;
}

const LANGUAGE_MAP: Record<string, LanguageInfo> = {
  en: { label: 'English', flag: '🇺🇸' },
  es: { label: 'Spanish', flag: '🇪🇸' },
  fr: { label: 'French', flag: '🇫🇷' },
  de: { label: 'German', flag: '🇩🇪' },
  it: { label: 'Italian', flag: '🇮🇹' },
  pt: { label: 'Portuguese', flag: '🇵🇹' },
  nl: { label: 'Dutch', flag: '🇳🇱' },
  pl: { label: 'Polish', flag: '🇵🇱' },
  ru: { label: 'Russian', flag: '🇷🇺' },
  ja: { label: 'Japanese', flag: '🇯🇵' },
  zh: { label: 'Chinese', flag: '🇨🇳' },
  ko: { label: 'Korean', flag: '🇰🇷' },
  ar: { label: 'Arabic', flag: '🇸🇦' },
  hi: { label: 'Hindi', flag: '🇮🇳' },
};

/**
 * Maps language codes to display labels and flag emojis
 * Returns English as default for unknown codes
 */
export function getLanguageInfo(code: string): LanguageInfo {
  return LANGUAGE_MAP[code] || LANGUAGE_MAP['en'];
}

/**
 * Returns list of supported language codes
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGE_MAP);
}

export type DeliveryDaysResult = { type: 'everyday' } | { type: 'days'; days: string[] };

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

/**
 * Formats delivery days array for display
 * Returns "Everyday" when all 7 days are selected, otherwise returns formatted day labels
 */
export function formatDeliveryDays(days: string[]): DeliveryDaysResult {
  if (days.length === 7) {
    return { type: 'everyday' };
  }
  return {
    type: 'days',
    days: days.map(day => DAY_LABELS[day] || day),
  };
}

/**
 * Returns the day label for a given day code
 */
export function getDayLabel(day: string): string {
  return DAY_LABELS[day] || day;
}

export interface TruncatedSubjects {
  displayed: string[];
  remaining: number;
}

const MAX_DISPLAYED_SUBJECTS = 8;

/**
 * Truncates subjects array for display
 * Shows first 8 subjects and returns count of remaining items
 */
export function truncateSubjects(subjects: string[]): TruncatedSubjects {
  if (subjects.length <= MAX_DISPLAYED_SUBJECTS) {
    return {
      displayed: subjects,
      remaining: 0,
    };
  }
  return {
    displayed: subjects.slice(0, MAX_DISPLAYED_SUBJECTS),
    remaining: subjects.length - MAX_DISPLAYED_SUBJECTS,
  };
}

/**
 * Creates numbered subjects for display with 1-based indexing
 */
export function numberSubjects(subjects: string[]): Array<{ index: number; subject: string }> {
  return subjects.map((subject, i) => ({
    index: i + 1,
    subject,
  }));
}

/**
 * Limits articles array to maximum display count
 */
export function limitRecentArticles<T>(articles: T[], limit: number = 5): T[] {
  return articles.slice(0, limit);
}
