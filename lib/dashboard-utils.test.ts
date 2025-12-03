import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getStatusBadgeVariant,
  getLanguageInfo,
  formatDeliveryDays,
  truncateSubjects,
  numberSubjects,
  limitRecentArticles,
  getSupportedLanguages,
  type ArticleStatus,
} from './dashboard-utils';

describe('dashboard-utils', () => {
  describe('Property 6: Status badge variant mapping', () => {
    // **Feature: customer-dashboard, Property 6: Status badge variant mapping**
    // **Validates: Requirements 3.3, 3.4, 3.5**
    it('should map "sent" to "default", "pending" to "secondary", and "draft" to "outline"', () => {
      const statusArbitrary = fc.constantFrom<ArticleStatus>('sent', 'pending', 'draft');

      fc.assert(
        fc.property(statusArbitrary, (status: ArticleStatus) => {
          const result = getStatusBadgeVariant(status);

          switch (status) {
            case 'sent':
              expect(result).toBe('default');
              break;
            case 'pending':
              expect(result).toBe('secondary');
              break;
            case 'draft':
              expect(result).toBe('outline');
              break;
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Delivery days display', () => {
    // **Feature: customer-dashboard, Property 8: Delivery days display**
    // **Validates: Requirements 4.3, 4.4**
    it('should return "everyday" type when all 7 days selected, otherwise return individual days', () => {
      const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const daysArbitrary = fc.subarray(allDays, { minLength: 0, maxLength: 7 });

      fc.assert(
        fc.property(daysArbitrary, (days: string[]) => {
          const result = formatDeliveryDays(days);

          if (days.length === 7) {
            expect(result.type).toBe('everyday');
          } else {
            expect(result.type).toBe('days');
            if (result.type === 'days') {
              expect(result.days.length).toBe(days.length);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Subjects queue truncation', () => {
    // **Feature: customer-dashboard, Property 2: Subjects queue truncation**
    // **Validates: Requirements 2.2**
    it('should display exactly 8 subjects when array length > 8 and show remaining count', () => {
      const subjectsArbitrary = fc.array(fc.string({ minLength: 1 }), {
        minLength: 0,
        maxLength: 20,
      });

      fc.assert(
        fc.property(subjectsArbitrary, (subjects: string[]) => {
          const result = truncateSubjects(subjects);

          if (subjects.length <= 8) {
            expect(result.displayed.length).toBe(subjects.length);
            expect(result.remaining).toBe(0);
          } else {
            expect(result.displayed.length).toBe(8);
            expect(result.remaining).toBe(subjects.length - 8);
          }

          // Displayed subjects should be the first N subjects
          for (let i = 0; i < result.displayed.length; i++) {
            expect(result.displayed[i]).toBe(subjects[i]);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Subjects numbering', () => {
    // **Feature: customer-dashboard, Property 3: Subjects numbering**
    // **Validates: Requirements 2.1**
    it('should prefix each subject with 1-based index', () => {
      const subjectsArbitrary = fc.array(fc.string({ minLength: 1 }), {
        minLength: 0,
        maxLength: 15,
      });

      fc.assert(
        fc.property(subjectsArbitrary, (subjects: string[]) => {
          const result = numberSubjects(subjects);

          expect(result.length).toBe(subjects.length);

          for (let i = 0; i < result.length; i++) {
            expect(result[i].index).toBe(i + 1);
            expect(result[i].subject).toBe(subjects[i]);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Recent articles limit', () => {
    // **Feature: customer-dashboard, Property 4: Recent articles limit**
    // **Validates: Requirements 3.1**
    it('should display at most 5 articles from the beginning of the array', () => {
      const articleArbitrary = fc.record({
        id: fc.uuid(),
        subject: fc.string({ minLength: 1 }),
        status: fc.constantFrom('draft', 'pending', 'sent'),
        generated_at: fc.date().map(d => d.toISOString()),
      });
      const articlesArbitrary = fc.array(articleArbitrary, { minLength: 0, maxLength: 20 });

      fc.assert(
        fc.property(articlesArbitrary, articles => {
          const result = limitRecentArticles(articles, 5);

          expect(result.length).toBeLessThanOrEqual(5);
          expect(result.length).toBe(Math.min(articles.length, 5));

          // Result should be the first N articles
          for (let i = 0; i < result.length; i++) {
            expect(result[i]).toBe(articles[i]);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Profile data display - Language info', () => {
    // **Feature: customer-dashboard, Property 7: Profile data display**
    // **Validates: Requirements 4.1, 4.2, 4.5**
    it('should return valid language info with label and flag for supported languages', () => {
      const supportedLanguages = getSupportedLanguages();
      const languageArbitrary = fc.constantFrom(...supportedLanguages);

      fc.assert(
        fc.property(languageArbitrary, (langCode: string) => {
          const result = getLanguageInfo(langCode);

          expect(result).toHaveProperty('label');
          expect(result).toHaveProperty('flag');
          expect(typeof result.label).toBe('string');
          expect(typeof result.flag).toBe('string');
          expect(result.label.length).toBeGreaterThan(0);
          expect(result.flag.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return English as default for unknown language codes', () => {
      const unknownCodeArbitrary = fc
        .string({ minLength: 2, maxLength: 5 })
        .filter(code => !getSupportedLanguages().includes(code));

      fc.assert(
        fc.property(unknownCodeArbitrary, (unknownCode: string) => {
          const result = getLanguageInfo(unknownCode);
          const englishInfo = getLanguageInfo('en');

          expect(result).toEqual(englishInfo);
        }),
        { numRuns: 100 }
      );
    });
  });
});
