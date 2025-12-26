# Implementation Plan

- [x] 1. Create the activate-style API endpoint
  - [x] 1.1 Create `/api/stripe/activate-style/route.ts` with POST handler
    - Query pending article styles for authenticated user
    - Update style to active (is_active: true, status: 'active')
    - Call syncStyleToSheets with the activated style
    - Return success response with style data and sync status
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_
  - [ ]\* 1.2 Write property test for style activation
    - **Property 2: Pending Style Activation**
    - **Validates: Requirements 2.2**
  - [ ]\* 1.3 Write property test for missing style handling
    - **Property 3: Missing Style Handling**
    - **Validates: Requirements 2.4**
  - [ ]\* 1.4 Write property test for sync error resilience
    - **Property 5: Sync Error Resilience**
    - **Validates: Requirements 3.5**

- [x] 2. Create the PaymentVerification component
  - [x] 2.1 Create `components/payment-verification.tsx` component
    - Define verification steps array with labels and status
    - Implement step status state management
    - Add animated progress indicators (spinner for in-progress, checkmark for complete)
    - Display error state with retry button
    - Show countdown and redirect on completion
    - _Requirements: 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1_
  - [ ]\* 2.2 Write property test for redirect URL construction
    - **Property 6: Redirect URL Construction**
    - **Validates: Requirements 5.3**

- [x] 3. Update the Subscribe page to handle payment verification
  - [x] 3.1 Add session_id detection in SubscribeContent component
    - Check for session_id URL parameter on mount
    - Set verification mode state when session_id is present
    - _Requirements: 1.1_
  - [x] 3.2 Integrate PaymentVerification component
    - Render PaymentVerification when in verification mode
    - Pass session_id and callbacks to component
    - Handle verification completion (redirect to dashboard)
    - Handle verification error (show error, allow retry)
    - _Requirements: 1.4, 1.5, 5.2, 5.3, 5.4_
  - [ ]\* 3.3 Write property test for session ID detection
    - **Property 1: Session ID Detection**
    - **Validates: Requirements 1.1**

- [x] 4. Implement the verification flow logic
  - [x] 4.1 Add verification flow in PaymentVerification component
    - Step 1: Call verify-session API, update step status
    - Step 2: Call activate-style API, update step status
    - Step 3: Mark sync complete based on API response
    - Step 4: Show success, start countdown, redirect
    - _Requirements: 2.3, 3.4, 5.1, 5.2_
  - [ ]\* 4.2 Write property test for sheets sync data completeness
    - **Property 4: Sheets Sync Data Completeness**
    - **Validates: Requirements 3.2, 3.3**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update checkout success URL
  - [x] 6.1 Update checkout route to use session_id in success URL
    - Change success_url to include `session_id={CHECKOUT_SESSION_ID}` parameter
    - Ensure redirect goes to `/subscribe?session_id={CHECKOUT_SESSION_ID}`
    - _Requirements: 1.1_

- [x] 7. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
