import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { toggleDay, DAYS, DayCode } from './day-selection';

/**
 * Arbitrary generator for day codes
 */
const dayCodeArbitrary = fc.constantFrom(...DAYS) as fc.Arbitrary<DayCode>;

/**
 * Arbitrary generator for arrays of unique day codes
 */
const selectedDaysArbitrary = fc
  .subarray([...DAYS] as DayCode[], { minLength: 0, maxLength: 7 })
  .map(days => [...new Set(days)]);

describe('day-selection', () => {
  describe('Property 6: Day selection toggle is idempotent', () => {
    // **Feature: onboarding-google-sheets, Property 6: Day selection toggle is idempotent**
    it('should return to original state when toggling the same day twice', () => {
      fc.assert(
        fc.property(
          selectedDaysArbitrary,
          dayCodeArbitrary,
          (selectedDays: DayCode[], day: DayCode) => {
            const afterFirstToggle = toggleDay(selectedDays, day);
            const afterSecondToggle = toggleDay(afterFirstToggle, day);

            // After toggling twice, should have the same days (order may differ)
            const originalSet = new Set(selectedDays);
            const resultSet = new Set(afterSecondToggle);

            expect(resultSet.size).toBe(originalSet.size);
            for (const d of originalSet) {
              expect(resultSet.has(d)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
