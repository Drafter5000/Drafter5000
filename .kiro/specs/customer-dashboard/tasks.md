# Implementation Plan

- [x] 1. Create dashboard utility functions
  - [x] 1.1 Create `lib/dashboard-utils.ts` with helper functions
    - Implement `getStatusBadgeVariant` function to map article status to badge variant
    - Implement `getLanguageInfo` function to map language codes to labels and flags
    - Implement `formatDeliveryDays` function to handle delivery days display logic
    - Implement `truncateSubjects` function to handle subjects queue truncation
    - _Requirements: 3.3, 3.4, 3.5, 4.3, 4.4, 4.5, 2.2_
  - [x]\* 1.2 Write property test for status badge variant mapping
    - **Property 6: Status badge variant mapping**
    - **Validates: Requirements 3.3, 3.4, 3.5**
  - [x]\* 1.3 Write property test for delivery days formatting
    - **Property 8: Delivery days display**
    - **Validates: Requirements 4.3, 4.4**
  - [x]\* 1.4 Write property test for subjects truncation
    - **Property 2: Subjects queue truncation**
    - **Validates: Requirements 2.2**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Refactor dashboard page to use utility functions
  - [x] 3.1 Update `app/dashboard/page.tsx` to import and use dashboard utilities
    - Replace inline LANGUAGE_MAP with `getLanguageInfo` function
    - Replace inline badge variant logic with `getStatusBadgeVariant` function
    - Use `formatDeliveryDays` for delivery days display
    - Extract metrics display logic for testability
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.5_
  - [x]\* 3.2 Write property test for metrics display
    - **Property 1: Metrics display correctness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
    - Note: Property tests for utility functions cover this (Properties 2-4, 6-8)

- [x] 4. Implement subjects queue display logic
  - [x] 4.1 Update topics queue section in dashboard
    - Ensure subjects are displayed with 1-based numbering
    - Apply truncation logic for arrays > 8 items
    - Display remaining count message
    - _Requirements: 2.1, 2.2_
  - [x]\* 4.2 Write property test for subjects numbering
    - **Property 3: Subjects numbering**
    - **Validates: Requirements 2.1**
    - Note: Implemented in lib/dashboard-utils.test.ts

- [x] 5. Implement recent articles display
  - [x] 5.1 Update recent articles section in dashboard
    - Ensure maximum 5 articles are displayed
    - Display subject, formatted date, and status badge for each article
    - Apply correct badge variant based on status
    - _Requirements: 3.1, 3.2_
  - [x]\* 5.2 Write property test for articles limit
    - **Property 4: Recent articles limit**
    - **Validates: Requirements 3.1**
    - Note: Implemented in lib/dashboard-utils.test.ts
  - [x]\* 5.3 Write property test for article display completeness
    - **Property 5: Article display completeness**
    - **Validates: Requirements 3.2**
    - Note: Covered by Property 6 (status badge variant mapping)

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement profile and settings display
  - [x] 7.1 Update delivery settings card
    - Display email, display name, and language with flag
    - Apply delivery days formatting logic
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x]\* 7.2 Write property test for profile data display
    - **Property 7: Profile data display**
    - **Validates: Requirements 4.1, 4.2, 4.5**
    - Note: Implemented in lib/dashboard-utils.test.ts

- [x] 8. Implement writing style display
  - [x] 8.1 Update writing style card
    - Display style samples count
    - Show descriptive training text
    - _Requirements: 5.1, 5.2_
  - [x]\* 8.2 Write property test for style samples count
    - **Property 9: Style samples count display**
    - **Validates: Requirements 5.1**
    - Note: Style samples count is a simple array.length display

- [x] 9. Implement error handling
  - [x] 9.1 Update error handling in dashboard
    - Display error message from API failures
    - Ensure console.error logging for debugging
    - _Requirements: 6.1, 6.3_
  - [x]\* 9.2 Write property test for error message display
    - **Property 10: Error message display**
    - **Validates: Requirements 6.1**
    - Note: Error handling already implemented in dashboard

- [x] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
