# Implementation Plan

- [x] 1. Update signup API to skip email verification and redirect to pricing
  - [x] 1.1 Modify `/api/auth/signup-with-style` to set email_confirm: true
    - Update `app/api/auth/signup-with-style/route.ts`
    - Change `email_confirm: false` to `email_confirm: true` in createUser call
    - Remove the email verification resend call
    - _Requirements: 4.3_
  - [x] 1.2 Update signup API response to return pricing redirect URL
    - Modify response to include `redirect_url: '/pricing'`
    - Add `success: true` flag to response
    - _Requirements: 4.6_
  - [x] 1.3 Add retry-friendly error responses to signup API
    - Return structured error responses with `retry: boolean` flag
    - Include field-specific errors in response
    - _Requirements: 8.1, 8.2_

- [x] 2. Update Step 3 page to redirect to pricing after signup
  - [x] 2.1 Modify step 3 form submission handler
    - Update `app/articles/generate/step-3/page.tsx` or the signup component
    - On successful signup, redirect to `/pricing` instead of showing email verification message
    - Clear sessionStorage draft data on successful redirect
    - _Requirements: 4.6_
  - [x] 2.2 Add error handling with retry capability to step 3
    - Display specific error messages from API response
    - Show retry button for retryable errors
    - Keep form data populated on error for easy retry
    - _Requirements: 8.1, 8.2_

- [x] 3. Update Stripe checkout to include pending_style metadata
  - [x] 3.1 Modify checkout API to detect pending style data
    - Update `app/api/stripe/checkout/route.ts`
    - Check if user has pending_style_data record
    - Add `pending_style: 'true'` to checkout session metadata
    - _Requirements: 6.2_

- [x] 4. Update Stripe webhook to process pending style data after payment
  - [x] 4.1 Enhance webhook handler for payment success flow
    - Update `app/api/stripe/webhook/route.ts`
    - On checkout.session.completed with pending_style flag:
      - Fetch pending_style_data from database
      - Create article_styles record
      - Sync to Google Sheets with job field
      - Delete pending_style_data record
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 4.2 Add error handling for webhook processing
    - Log errors but don't fail the webhook response
    - Preserve payment record for manual recovery if style creation fails
    - _Requirements: 8.4, 8.5_

- [x] 5. Update pricing page for post-signup flow
  - [x] 5.1 Add success/error message handling to pricing page
    - Update `app/pricing/page.tsx`
    - Display success message when redirected from signup
    - Display error message if payment was cancelled
    - _Requirements: 6.4, 8.3_

- [x] 6. Add payment success redirect to dashboard
  - [x] 6.1 Update payment success callback handling
    - Ensure user is redirected to dashboard after successful payment
    - Display success message on dashboard
    - _Requirements: 7.4_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Verify existing property tests still pass
  - [x] 8.1 Run existing property tests for validation functions
    - Verify Property 1 (Style Sample Validation) passes
    - Verify Property 2 (Topic Validation) passes
    - Verify Property 3 (Signup Form Validation) passes
    - Verify Property 4 (Draft Session Round-Trip) passes
    - _Requirements: 2.2, 3.2, 4.2, 5.1, 5.2_

- [x] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
