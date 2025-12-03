import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  countWords,
  isStyleSampleValid,
  isSubjectValid,
  isSubjectListValid,
  isStep3FormValid,
  selectAISuggestion,
} from './onboarding-validation'

describe('onboarding-validation', () => {
  describe('Property 1: Word count accuracy', () => {
    // **Feature: onboarding-google-sheets, Property 1: Word count accuracy**
    it('should equal the number of whitespace-separated non-empty tokens', () => {
      fc.assert(
        fc.property(fc.string(), (text: string) => {
          const result = countWords(text)
          const expected = text
            .trim()
            .split(/\s+/)
            .filter(token => token.length > 0).length

          expect(result).toBe(expected)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 2: Style sample validation enables continue', () => {
    // **Feature: onboarding-google-sheets, Property 2: Style sample validation enables continue**
    it('should enable continue iff at least one sample has non-zero length after trimming', () => {
      const styleSamplesArbitrary = fc.array(fc.string(), { minLength: 0, maxLength: 5 })

      fc.assert(
        fc.property(styleSamplesArbitrary, (samples: string[]) => {
          const result = isStyleSampleValid(samples)
          const expected = samples.some(s => s.trim().length > 0)

          expect(result).toBe(expected)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 3: Subject addition preserves uniqueness', () => {
    // **Feature: onboarding-google-sheets, Property 3: Subject addition preserves uniqueness**
    it('should allow addition only if non-empty, non-whitespace, and not duplicate', () => {
      const existingSubjectsArbitrary = fc.array(fc.string({ minLength: 1 }), {
        minLength: 0,
        maxLength: 10,
      })
      const newSubjectArbitrary = fc.string()

      fc.assert(
        fc.property(
          existingSubjectsArbitrary,
          newSubjectArbitrary,
          (existingSubjects: string[], newSubject: string) => {
            const result = isSubjectValid(newSubject, existingSubjects)
            const trimmed = newSubject.trim()

            // Should be false if empty or whitespace-only
            if (trimmed === '') {
              expect(result).toBe(false)
              return
            }

            // Should be false if duplicate (case-insensitive)
            const isDuplicate = existingSubjects.some(
              existing => existing.toLowerCase() === trimmed.toLowerCase()
            )
            expect(result).toBe(!isDuplicate)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 5: Subject list validation enables continue', () => {
    // **Feature: onboarding-google-sheets, Property 5: Subject list validation enables continue**
    it('should enable continue iff the list contains at least one element', () => {
      const subjectListArbitrary = fc.array(fc.string(), { minLength: 0, maxLength: 10 })

      fc.assert(
        fc.property(subjectListArbitrary, (subjects: string[]) => {
          const result = isSubjectListValid(subjects)
          const expected = subjects.length > 0

          expect(result).toBe(expected)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 7: Form validation enables complete', () => {
    // **Feature: onboarding-google-sheets, Property 7: Form validation enables complete**
    it('should enable complete iff all required fields are non-empty and at least one delivery day', () => {
      const formStateArbitrary = fc.record({
        email: fc.string(),
        firstName: fc.string(),
        lastName: fc.string(),
        deliveryDays: fc.array(fc.constantFrom('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'), {
          minLength: 0,
          maxLength: 7,
        }),
      })

      fc.assert(
        fc.property(formStateArbitrary, form => {
          const result = isStep3FormValid(
            form.email,
            form.firstName,
            form.lastName,
            form.deliveryDays
          )

          const expected =
            form.email.trim().length > 0 &&
            form.firstName.trim().length > 0 &&
            form.lastName.trim().length > 0 &&
            form.deliveryDays.length > 0

          expect(result).toBe(expected)
        }),
        { numRuns: 100 }
      )
    })
  })
})

describe('Property 4: AI suggestion selection moves item between lists', () => {
  // **Feature: onboarding-google-sheets, Property 4: AI suggestion selection moves item between lists**
  it('should move suggestion to subjects and remove from suggestions', () => {
    const nonEmptyStringArbitrary = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)
    const subjectsArbitrary = fc.array(nonEmptyStringArbitrary, { minLength: 0, maxLength: 5 })
    // Use uniqueArray to ensure suggestions are unique (as they would be in real AI suggestions)
    const suggestionsArbitrary = fc
      .array(nonEmptyStringArbitrary, { minLength: 1, maxLength: 10 })
      .map(arr => [...new Set(arr)])
      .filter(arr => arr.length > 0)

    fc.assert(
      fc.property(
        subjectsArbitrary,
        suggestionsArbitrary,
        fc.nat(),
        (subjects: string[], suggestions: string[], indexSeed: number) => {
          // Pick a suggestion from the list
          const suggestionIndex = indexSeed % suggestions.length
          const suggestion = suggestions[suggestionIndex]

          const result = selectAISuggestion(subjects, suggestions, suggestion)

          // Check if suggestion was a duplicate (case-insensitive)
          const isDuplicate = subjects.some(s => s.toLowerCase() === suggestion.toLowerCase())

          if (isDuplicate) {
            // If duplicate, lists should remain unchanged
            expect(result.subjects).toEqual(subjects)
            expect(result.suggestions).toEqual(suggestions)
          } else {
            // Suggestion should be in subjects
            expect(result.subjects).toContain(suggestion)
            // Suggestion should be removed from suggestions
            expect(result.suggestions).not.toContain(suggestion)
            // Subjects should have one more element
            expect(result.subjects.length).toBe(subjects.length + 1)
            // Suggestions should have one less element
            expect(result.suggestions.length).toBe(suggestions.length - 1)
            // All other subjects should remain
            for (const s of subjects) {
              expect(result.subjects).toContain(s)
            }
            // All other suggestions should remain
            for (const s of suggestions) {
              if (s !== suggestion) {
                expect(result.suggestions).toContain(s)
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
