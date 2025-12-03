import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  OnboardingRowData,
  serializeToRow,
  deserializeFromRow,
  TOTAL_COLUMNS,
  COLUMN_ORDER,
} from './onboarding-serializer';

/**
 * Arbitrary generator for non-empty strings without commas
 * (commas would break CSV serialization)
 */
const nonEmptyStringWithoutComma = fc.string({ minLength: 1 }).filter(s => !s.includes(','));

/**
 * Arbitrary generator for valid ISO date strings
 * Uses integer-based generation to avoid invalid date issues
 */
const isoDateStringArbitrary = fc
  .integer({ min: 946684800000, max: 4102444800000 }) // 2000-01-01 to 2100-01-01 in ms
  .map(ms => new Date(ms).toISOString());

/**
 * Arbitrary generator for valid OnboardingRowData objects
 *
 * Note: Array fields exclude empty strings because:
 * 1. Empty strings in style_samples/subjects have no practical meaning
 * 2. CSV format cannot distinguish between [] and [""] after round-trip
 */
const onboardingRowDataArbitrary = fc.record({
  email: fc.emailAddress(),
  display_name: nonEmptyStringWithoutComma,
  created_at: isoDateStringArbitrary,
  preferred_language: fc.constantFrom('en', 'es', 'fr', 'de', 'pt'),
  delivery_days: fc.array(fc.constantFrom('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'), {
    minLength: 1,
    maxLength: 7,
  }),
  status: fc.constantFrom('active', 'paused') as fc.Arbitrary<'active' | 'paused'>,
  style_samples: fc.array(nonEmptyStringWithoutComma, { minLength: 0, maxLength: 3 }),
  subjects: fc.array(nonEmptyStringWithoutComma, { minLength: 0, maxLength: 10 }),
});

describe('onboarding-serializer', () => {
  describe('Property 9: Serialization round-trip preserves data', () => {
    // **Feature: onboarding-google-sheets, Property 9: Serialization round-trip preserves data**
    it('should preserve data through serialize then deserialize', () => {
      fc.assert(
        fc.property(onboardingRowDataArbitrary, (data: OnboardingRowData) => {
          const serialized = serializeToRow(data);
          const deserialized = deserializeFromRow(serialized);

          expect(deserialized.email).toBe(data.email);
          expect(deserialized.display_name).toBe(data.display_name);
          expect(deserialized.created_at).toBe(data.created_at);
          expect(deserialized.preferred_language).toBe(data.preferred_language);
          expect(deserialized.delivery_days).toEqual(data.delivery_days);
          expect(deserialized.status).toBe(data.status);
          expect(deserialized.style_samples).toEqual(data.style_samples);
          expect(deserialized.subjects).toEqual(data.subjects);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Serialized row contains all required fields', () => {
    // **Feature: onboarding-google-sheets, Property 8: Serialized row contains all required fields**
    it('should produce exactly 8 elements with correct field positions', () => {
      fc.assert(
        fc.property(onboardingRowDataArbitrary, (data: OnboardingRowData) => {
          const serialized = serializeToRow(data);

          // Verify exactly 8 elements
          expect(serialized.length).toBe(TOTAL_COLUMNS);

          // Verify field positions
          expect(serialized[COLUMN_ORDER.EMAIL]).toBe(data.email);
          expect(serialized[COLUMN_ORDER.DISPLAY_NAME]).toBe(data.display_name);
          expect(serialized[COLUMN_ORDER.CREATED_AT]).toBe(data.created_at);
          expect(serialized[COLUMN_ORDER.PREFERRED_LANGUAGE]).toBe(data.preferred_language);
          expect(serialized[COLUMN_ORDER.DELIVERY_DAYS]).toBe(data.delivery_days.join(','));
          expect(serialized[COLUMN_ORDER.STATUS]).toBe(data.status);
          expect(serialized[COLUMN_ORDER.STYLE_SAMPLES]).toBe(data.style_samples.join(','));
          expect(serialized[COLUMN_ORDER.SUBJECTS]).toBe(data.subjects.join(','));
        }),
        { numRuns: 100 }
      );
    });
  });
});
