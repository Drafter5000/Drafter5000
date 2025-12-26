# Implementation Plan

- [x] 1. Create subscription utility functions
  - [x] 1.1 Create `lib/subscription-utils.ts` with core utility functions
    - Implement `isSubscriptionExpired(status)` function that returns true for 'past_due' and 'canceled' statuses
    - Implement `getSubscriptionState(profile, subscription)` function to compute derived state
    - Implement `getExpirationMessage(state)` function to format user-facing messages
    - Export TypeScript types for `SubscriptionStatus` and `SubscriptionState`
    - _Requirements: 5.4, 1.1, 1.2, 1.3_

  - [ ]\* 1.2 Write property test for subscription expiration check
    - **Property 1: Subscription expiration check consistency**
    - **Validates: Requirements 5.4**

- [x] 2. Create subscription status hook
  - [x] 2.1 Create `lib/hooks/use-subscription-status.ts` hook
    - Fetch subscription data from `/api/stripe/subscription` endpoint
    - Compute `isExpired` using `isSubscriptionExpired` utility
    - Return `status`, `isExpired`, `isLoading`, `expirationDate`, `canAccessFeatures`, and `refetch` function
    - Handle loading and error states gracefully
    - _Requirements: 1.1, 2.1, 5.4_

  - [ ]\* 2.2 Write unit tests for useSubscriptionStatus hook
    - Test loading state handling
    - Test expired subscription detection
    - Test active subscription detection
    - _Requirements: 1.1, 2.1_

- [x] 3. Enhance subscription API endpoint
  - [x] 3.1 Update `app/api/stripe/subscription/route.ts` to include expiration data
    - Add `is_expired` computed field to response
    - Add `expiration_date` field from `current_period_end`
    - Ensure backward compatibility with existing response structure
    - _Requirements: 1.3, 5.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create expiration banner component
  - [x] 5.1 Create `components/subscription-expiration-banner.tsx`
    - Display prominent banner with expiration message and date
    - Include primary-styled "Renew Now" button
    - Handle loading state during renewal redirect
    - Support both modern and win95 design modes
    - _Requirements: 1.1, 1.3, 4.1_

  - [ ]\* 5.2 Write property test for expiration message rendering
    - **Property 3: Expiration message includes required information**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 6. Create renewal modal component
  - [x] 6.1 Create `components/renewal-modal.tsx`
    - Display modal with renewal prompt when user attempts to access disabled feature
    - Include "Renew Subscription" button that redirects to Stripe portal
    - Include "Cancel" button to dismiss modal
    - Support both modern and win95 design modes
    - _Requirements: 2.5, 3.1, 4.4_

- [x] 7. Create feature gate component
  - [x] 7.1 Create `components/feature-gate.tsx`
    - Wrap children and conditionally render based on subscription status
    - Show disabled state with tooltip when subscription is expired
    - Trigger renewal modal on click when disabled
    - Accept custom tooltip message prop
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]\* 7.2 Write property test for feature disabling
    - **Property 2: Feature disabling for expired subscriptions**
    - **Validates: Requirements 2.1, 2.2, 2.4**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update dashboard page for expiration handling
  - [x] 9.1 Update `app/dashboard/page.tsx` to show expiration banner
    - Import and use `useSubscriptionStatus` hook
    - Conditionally render `SubscriptionExpirationBanner` when expired
    - Display renewal card in prominent position for expired users
    - Wrap feature actions with `FeatureGate` component
    - _Requirements: 1.1, 4.3_

- [x] 10. Update billing page for expiration handling
  - [x] 10.1 Update `app/dashboard/billing/page.tsx` to enhance expiration UI
    - Display subscription status as "Expired" with visual distinction
    - Show expiration date in the current plan section
    - Make renewal button the primary CTA when expired
    - Display usage in read-only mode when expired
    - Show "0 remaining" for tokens when expired
    - _Requirements: 1.2, 1.3, 4.2, 6.1, 6.2, 6.3_

  - [ ]\* 10.2 Write property test for usage display
    - **Property 6: Usage display for expired subscriptions**
    - **Validates: Requirements 6.1, 6.2**

- [x] 11. Update article generation pages with feature gating
  - [x] 11.1 Update article generation components to use FeatureGate
    - Wrap article generation form with `FeatureGate`
    - Disable generation button for expired subscriptions
    - Show tooltip explaining subscription requirement
    - _Requirements: 2.1, 2.4_

- [x] 12. Update article styles pages with feature gating
  - [x] 12.1 Update article style components to use FeatureGate
    - Wrap style creation form with `FeatureGate`
    - Wrap style editing form with `FeatureGate`
    - Disable form inputs for expired subscriptions
    - _Requirements: 2.2, 2.4_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Verify webhook handling for renewal flow
  - [x] 14.1 Review and verify `app/api/stripe/webhook/route.ts` handles renewal correctly
    - Verify `invoice.payment_succeeded` updates status to 'active'
    - Verify `invoice.payment_failed` updates status to 'past_due'
    - Verify `customer.subscription.deleted` updates status to 'canceled'
    - Add logging for renewal events
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]\* 14.2 Write property test for webhook status mapping
    - **Property 5: Webhook status mapping correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 15. Verify portal return URL configuration
  - [x] 15.1 Review `app/api/stripe/portal/route.ts` for correct return URL
    - Verify return_url points to `/dashboard/billing`
    - Ensure URL is correctly constructed for all environments
    - _Requirements: 3.2_

  - [ ]\* 15.2 Write property test for portal return URL
    - **Property 4: Portal session return URL configuration**
    - **Validates: Requirements 3.2**

- [x] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
