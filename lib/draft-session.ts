/**
 * Draft Session Service
 *
 * Manages browser sessionStorage for the onboarding flow.
 * Stores draft data until account creation is complete.
 *
 * Requirements: 1.3, 5.1, 5.2
 */

import { formatDateForSheets } from '@/lib/utils/date-format';

const DRAFT_SESSION_KEY = 'onboarding_draft_session';

/**
 * Sample article data structure for step 1
 */
export interface SampleArticle {
  content: string;
  wordCount: number;
}

/**
 * Topic data structure for step 2
 */
export interface TopicEntry {
  topic: string;
  status: 'Needs Draft' | 'Needs to be sent' | 'Sent';
  subject: string;
  article: string;
  lastUpdate: string;
}

/**
 * Draft session data structure
 */
export interface DraftSession {
  style_samples: string[];
  sample_articles: SampleArticle[];
  subjects: string[];
  topic_entries: TopicEntry[];
  preferred_language: string;
  delivery_days: string[];
  current_step: 1 | 2 | 3;
  last_updated: string;
  name?: string;
  email?: string;
  job?: string;
}

/**
 * Default empty draft session
 */
const DEFAULT_DRAFT_SESSION: DraftSession = {
  style_samples: [],
  sample_articles: [],
  subjects: [],
  topic_entries: [],
  preferred_language: 'en',
  delivery_days: [],
  current_step: 1,
  last_updated: new Date().toISOString(),
};

/**
 * Check if sessionStorage is available
 */
function isSessionStorageAvailable(): boolean {
  try {
    const testKey = '__test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * DraftSessionService - Client-side service for managing draft session data
 */
export const DraftSessionService = {
  /**
   * Save draft session data to sessionStorage
   * Merges with existing data if present
   *
   * @param data - Partial draft session data to save
   */
  save(data: Partial<DraftSession>): void {
    if (!isSessionStorageAvailable()) {
      console.warn('sessionStorage not available, draft data will not persist');
      return;
    }

    const existing = this.load();
    const updated: DraftSession = {
      ...DEFAULT_DRAFT_SESSION,
      ...existing,
      ...data,
      last_updated: new Date().toISOString(),
    };

    sessionStorage.setItem(DRAFT_SESSION_KEY, JSON.stringify(updated));
  },

  /**
   * Load draft session data from sessionStorage
   *
   * @returns DraftSession or null if not found
   */
  load(): DraftSession | null {
    if (!isSessionStorageAvailable()) {
      return null;
    }

    const stored = sessionStorage.getItem(DRAFT_SESSION_KEY);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as DraftSession;
    } catch {
      console.warn('Failed to parse draft session data');
      return null;
    }
  },

  /**
   * Clear draft session data from sessionStorage
   */
  clear(): void {
    if (!isSessionStorageAvailable()) {
      return;
    }

    sessionStorage.removeItem(DRAFT_SESSION_KEY);
  },

  /**
   * Get the current step from draft session
   *
   * @returns Current step number (1, 2, or 3) or 1 if not found
   */
  getStep(): 1 | 2 | 3 {
    const session = this.load();
    return session?.current_step ?? 1;
  },

  /**
   * Check if draft session exists and has data
   *
   * @returns true if draft session exists with data
   */
  exists(): boolean {
    const session = this.load();
    return session !== null;
  },

  /**
   * Get the last updated timestamp
   *
   * @returns ISO timestamp string or null if not found
   */
  getLastUpdated(): string | null {
    const session = this.load();
    return session?.last_updated ?? null;
  },

  /**
   * Save sample articles with word counts
   *
   * @param articles - Array of article content strings
   */
  saveSampleArticles(articles: string[]): void {
    const sampleArticles: SampleArticle[] = articles
      .filter(a => a.trim().length > 0)
      .map(content => ({
        content: content.trim(),
        wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      }));

    this.save({
      style_samples: articles.filter(a => a.trim()),
      sample_articles: sampleArticles,
    });
  },

  /**
   * Save topics as topic entries with default "Needs Draft" status
   *
   * @param subjects - Array of topic/subject strings
   */
  saveTopicEntries(subjects: string[]): void {
    const formattedDate = formatDateForSheets(new Date());

    const topicEntries: TopicEntry[] = subjects.map(topic => ({
      topic,
      status: 'Needs Draft',
      subject: topic,
      article: '',
      lastUpdate: formattedDate,
    }));

    this.save({
      subjects,
      topic_entries: topicEntries,
    });
  },

  /**
   * Get sample articles
   *
   * @returns Array of SampleArticle objects or empty array
   */
  getSampleArticles(): SampleArticle[] {
    const session = this.load();
    return session?.sample_articles ?? [];
  },

  /**
   * Get topic entries
   *
   * @returns Array of TopicEntry objects or empty array
   */
  getTopicEntries(): TopicEntry[] {
    const session = this.load();
    return session?.topic_entries ?? [];
  },
};
