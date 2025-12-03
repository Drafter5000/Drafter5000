# Implementation Plan

- [x] 1. Set up row serialization utilities
  - [x] 1.1 Create OnboardingRowData interface and serialization functions
    - Create `lib/onboarding-serializer.ts` with `serializeToRow` and `deserializeFromRow` functions
    - Define column order constants for Google Sheets row format
    - Implement array field joining with comma separator
    - _Requirements: 5.1, 5.2, 5.3_
  - [x]\* 1.2 Write property test for serialization round-trip
    - **Property 9: Serialization round-trip preserves data**
    - **Validates: Requirements 5.4**
  - [x]\* 1.3 Write property test for row field completeness
    - **Property 8: Serialized row contains all required fields**
    - **Validates: Requirements 4.3, 5.1**

- [x] 2. Implement validation utility functions
  - [x] 2.1 Create validation utilities for onboarding forms
    - Create `lib/onboarding-validation.ts` with validation functions
    - Implement `countWords(text: string): number` function
    - Implement `isStyleSampleValid(samples: string[]): boolean` function
    - Implement `isSubjectValid(subject: string, existingSubjects: string[]): boolean` function
    - Implement `isStep3FormValid(email, firstName, lastName, deliveryDays): boolean` function
    - _Requirements: 1.2, 1.3, 2.2, 2.6, 3.4_
  - [x]\* 2.2 Write property test for word count accuracy
    - **Property 1: Word count accuracy**
    - **Validates: Requirements 1.2**
  - [x]\* 2.3 Write property test for style sample validation
    - **Property 2: Style sample validation enables continue**
    - **Validates: Requirements 1.3, 1.5**
  - [x]\* 2.4 Write property test for subject addition
    - **Property 3: Subject addition preserves uniqueness**
    - **Validates: Requirements 2.2, 2.6**
  - [x]\* 2.5 Write property test for subject list validation
    - **Property 5: Subject list validation enables continue**
    - **Validates: Requirements 2.5**
  - [x]\* 2.6 Write property test for form validation
    - **Property 7: Form validation enables complete**
    - **Validates: Requirements 3.4, 3.5**

- [x] 3. Implement day selection utilities
  - [x] 3.1 Create day selection toggle utility
    - Create `lib/day-selection.ts` with `toggleDay` and `toggleAllDays` functions
    - Define day constants (mon, tue, wed, thu, fri, sat, sun)
    - _Requirements: 3.2, 3.3_
  - [x]\* 3.2 Write property test for day toggle idempotence
    - **Property 6: Day selection toggle is idempotent**
    - **Validates: Requirements 3.2**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update Step 1 page to use validation utilities
  - [x] 5.1 Refactor Step 1 page with validation utilities
    - Import and use `countWords` function for word count display
    - Import and use `isStyleSampleValid` for continue button state
    - Ensure existing functionality is preserved
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6. Update Step 2 page with subject validation
  - [x] 6.1 Refactor Step 2 page with validation utilities
    - Import and use `isSubjectValid` for add subject logic
    - Implement AI suggestion selection that moves items between lists
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x]\* 6.2 Write property test for AI suggestion selection
    - **Property 4: AI suggestion selection moves item between lists**
    - **Validates: Requirements 2.4**

- [x] 7. Update Step 3 page with form validation
  - [x] 7.1 Refactor Step 3 page with validation and day selection utilities
    - Import and use `isStep3FormValid` for complete button state
    - Import and use `toggleDay` and `toggleAllDays` for day selection
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8. Update Step 3 API route for Google Sheets integration
  - [x] 8.1 Update API route to use serialization utilities
    - Import `serializeToRow` from onboarding-serializer
    - Fetch complete onboarding data from Supabase (style_samples, subjects from previous steps)
    - Serialize all data to row format
    - Append row to Google Sheets using existing `appendCustomerToSheet` function
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
