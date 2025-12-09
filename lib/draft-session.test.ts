import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { DraftSessionService, DraftSession } from './draft-session';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

// Setup mock before tests
Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('DraftSessionService', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('Property 4: Draft Session Round-Trip (Navigation)', () => {
    // **Feature: onboarding-signup-flow, Property 4: Draft Session Round-Trip (Navigation)**
    it('should return equivalent object after save and load', () => {
      const draftSessionArbitrary = fc.record({
        style_samples: fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
        subjects: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
        preferred_language: fc.constantFrom(
          'en',
          'es',
          'fr',
          'de',
          'it',
          'pt',
          'nl',
          'ja',
          'zh',
          'ko'
        ),
        delivery_days: fc.array(fc.constantFrom('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'), {
          minLength: 0,
          maxLength: 7,
        }),
        current_step: fc.constantFrom(1, 2, 3) as fc.Arbitrary<1 | 2 | 3>,
      });

      fc.assert(
        fc.property(draftSessionArbitrary, data => {
          // Clear storage before each test
          mockSessionStorage.clear();

          // Save the data
          DraftSessionService.save(data);

          // Load the data
          const loaded = DraftSessionService.load();

          // Verify the loaded data matches (excluding last_updated which is auto-generated)
          expect(loaded).not.toBeNull();
          expect(loaded!.style_samples).toEqual(data.style_samples);
          expect(loaded!.subjects).toEqual(data.subjects);
          expect(loaded!.preferred_language).toBe(data.preferred_language);
          expect(loaded!.delivery_days).toEqual(data.delivery_days);
          expect(loaded!.current_step).toBe(data.current_step);
          expect(loaded!.last_updated).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Draft Session Round-Trip (Refresh)', () => {
    // **Feature: onboarding-signup-flow, Property 5: Draft Session Round-Trip (Refresh)**
    it('should persist data across simulated page refresh', () => {
      const draftSessionArbitrary = fc.record({
        style_samples: fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
        subjects: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
        preferred_language: fc.constantFrom(
          'en',
          'es',
          'fr',
          'de',
          'it',
          'pt',
          'nl',
          'ja',
          'zh',
          'ko'
        ),
        delivery_days: fc.array(fc.constantFrom('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'), {
          minLength: 0,
          maxLength: 7,
        }),
        current_step: fc.constantFrom(1, 2, 3) as fc.Arbitrary<1 | 2 | 3>,
      });

      fc.assert(
        fc.property(draftSessionArbitrary, data => {
          // Clear storage before each test
          mockSessionStorage.clear();

          // Save the data (simulating before refresh)
          DraftSessionService.save(data);

          // Simulate page refresh by directly reading from storage
          // (In real scenario, sessionStorage persists across page refreshes within same session)
          const storedValue = mockSessionStorage.getItem('onboarding_draft_session');
          expect(storedValue).not.toBeNull();

          // Parse and verify (simulating after refresh)
          const parsed = JSON.parse(storedValue!) as DraftSession;
          expect(parsed.style_samples).toEqual(data.style_samples);
          expect(parsed.subjects).toEqual(data.subjects);
          expect(parsed.preferred_language).toBe(data.preferred_language);
          expect(parsed.delivery_days).toEqual(data.delivery_days);
          expect(parsed.current_step).toBe(data.current_step);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Basic operations', () => {
    it('should save and load data correctly', () => {
      const testData: Partial<DraftSession> = {
        style_samples: ['sample1', 'sample2'],
        subjects: ['topic1'],
        current_step: 2,
      };

      DraftSessionService.save(testData);
      const loaded = DraftSessionService.load();

      expect(loaded).not.toBeNull();
      expect(loaded!.style_samples).toEqual(['sample1', 'sample2']);
      expect(loaded!.subjects).toEqual(['topic1']);
      expect(loaded!.current_step).toBe(2);
    });

    it('should clear data correctly', () => {
      DraftSessionService.save({ style_samples: ['test'] });
      expect(DraftSessionService.exists()).toBe(true);

      DraftSessionService.clear();
      expect(DraftSessionService.exists()).toBe(false);
      expect(DraftSessionService.load()).toBeNull();
    });

    it('should return correct step', () => {
      expect(DraftSessionService.getStep()).toBe(1); // Default when no session

      DraftSessionService.save({ current_step: 3 });
      expect(DraftSessionService.getStep()).toBe(3);
    });

    it('should merge data on subsequent saves', () => {
      DraftSessionService.save({ style_samples: ['sample1'] });
      DraftSessionService.save({ subjects: ['topic1'] });

      const loaded = DraftSessionService.load();
      expect(loaded!.style_samples).toEqual(['sample1']);
      expect(loaded!.subjects).toEqual(['topic1']);
    });
  });
});
