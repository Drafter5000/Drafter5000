# Implementation Plan

- [x] 1. Set up validation utilities and draft session service
  - [x] 1.1 Create validation utility functions for style samples, topics, and signup form
    - Create `lib/onboarding-validation.ts` with validation functions
    - `validateStyleSample(text: string): boolean` - returns true if length >= 100
    - `validateTopic(text: string): boolean` - returns true if length 3-200
    - `validateSignupForm(data): ValidationResult` - validates all signup fields
    - _Requirements: 2.2, 3.2, 4.2_
  - [x] 1.2 Write property test for style sample validation
    - **Property 1: Style Sample Validation**
    - **Validates: Requirements 2.2**
  - [x] 1.3 Write property test for topic validation
    - **Property 2: Topic Validation**
    - **Validates: Requirements 3.2**
  - [x] 1.4 Write property test for signup form validation
    - **Property 3: Signup Form Validation**
    - **Validates: Requirements 4.2**
  - [x] 1.5 Create DraftSessionService for browser sessionStorage management
    - Create `lib/draft-session.ts` with save, load, clear, getStep methods
    - Define DraftSession interface with style_samples, subjects, preferred_language, delivery_days, current_step, last_updated
    - _Requirements: 1.3, 5.1, 5.2_
  - [x] 1.6 Write property test for draft session round-trip
    - **Property 4: Draft Session Round-Trip (Navigation)**
    - **Property 5: Draft Session Round-Trip (Refresh)**
    - **Validates: Requirements 5.1, 5.2**

- [x] 2. Checkpoint - Ensure all tests pass
  - All tests pass (15 tests in 2 files)

- [x] 3. Update database schema and types
  - [x] 3.1 Create migration script to add job field to user_profiles
    - Create `scripts/13-add-job-field.sql` with ALTER TABLE statement
    - Add job VARCHAR(255) column to user_profiles table
    - _Requirements: 6.1_
  - [x] 3.2 Update TypeScript types for job field
    - Update `lib/types.ts` UserProfile interface to include job field
    - Update ArticleStyleStep3Data to include job field
    - _Requirements: 6.1_

- [x] 4. Update Google Sheets integration for job field
  - [x] 4.1 Update MainSheetRowData interface to include customerJob
    - Modify `lib/google-sheets.ts` to add customerJob field
    - Update appendToMainSheet to include job in row data
    - _Requirements: 6.2, 6.3_
  - [x] 4.2 Update article-styles-sync service to pass job field
    - Modify `lib/services/article-styles-sync.ts` syncStyleToSheets function
    - Include job field from user profile in sync data
    - _Requirements: 6.2_

- [x] 5. Create new API endpoint for signup with style
  - [x] 5.1 Create POST /api/auth/signup-with-style endpoint
    - Create `app/api/auth/signup-with-style/route.ts`
    - Accept name, email, password, job, style data
    - Create user account via Supabase Auth
    - Store pending style data in user metadata or separate table
    - Return user_id and redirect to Stripe checkout
    - _Requirements: 4.3, 4.4_

- [x] 6. Modify Stripe webhook to handle pending style data
  - [x] 6.1 Update webhook handler for payment success
    - Modify `app/api/stripe/webhook/route.ts`
    - On checkout.session.completed, check for pending style data
    - Create article_style record from pending data
    - Sync to Google Sheets with job field
    - _Requirements: 4.5, 4.6_

- [x] 7. Update onboarding layout to remove authentication requirement
  - [x] 7.1 Remove ProtectedRoute wrapper from layout
    - Modify `app/articles/generate/layout.tsx`
    - Remove ProtectedRoute component wrapper
    - Add simple public header with logo only
    - _Requirements: 7.1, 8.1, 8.2_

- [x] 8. Update Step 1 page for anonymous access
  - [x] 8.1 Refactor step 1 to use DraftSessionService
    - Modify `app/articles/generate/step-1/page.tsx`
    - Remove useAuth hook and user dependency
    - Load initial data from DraftSessionService
    - Save to DraftSessionService on submit
    - Use new validation functions
    - _Requirements: 1.2, 2.1, 2.3, 2.4_

- [x] 9. Update Step 2 page for anonymous access
  - [x] 9.1 Refactor step 2 to use DraftSessionService
    - Modify `app/articles/generate/step-2/page.tsx`
    - Remove useAuth hook and user dependency
    - Load initial data from DraftSessionService
    - Save to DraftSessionService on submit
    - Use new validation functions
    - _Requirements: 3.1, 3.3, 3.4_

- [x] 10. Redesign Step 3 page with signup and payment
  - [x] 10.1 Create new Step 3 page with signup form
    - Rewrite `app/articles/generate/step-3/page.tsx`
    - Add signup form fields: name, email, password, confirmPassword, job
    - Load draft data from DraftSessionService
    - Integrate with /api/auth/signup-with-style endpoint
    - Handle redirect to Stripe checkout
    - Handle payment success callback
    - Clear DraftSessionService on success
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.3_
  - [x] 10.2 Create StyleFormStep3Signup component
    - Create new component in `components/articles/style-form-step3-signup.tsx`
    - Include all signup form fields with validation
    - Display job field with appropriate label
    - Show final step messaging
    - _Requirements: 4.1, 4.2, 8.3_

- [x] 11. Checkpoint - Ensure all tests pass
  - All tests pass (15 tests in 2 files)

- [x] 12. Clean up old code and create feature branch
  - [x] 12.1 Remove redundant authenticated flow code
    - Old StyleFormStep3 component kept for backward compatibility
    - Unused imports removed from step pages
    - _Requirements: 7.2, 7.3_
  - [x] 12.2 Update landing page Get Started button link
    - Verified `app/page.tsx` links to `/articles/generate/step-1`
    - Button is prominent and accessible
    - _Requirements: 1.1_

- [x] 13. Final Checkpoint - Ensure all tests pass
  - All tests pass (15 tests in 2 files)
