# Implementation Plan

- [x] 1. Create database schema and types
  - [x] 1.1 Create SQL migration for subscription_plans and plan_features tables
    - Add subscription_plans table with all required fields
    - Add plan_features table with foreign key to subscription_plans
    - Add indexes for performance
    - Add RLS policies for read access
    - _Requirements: 1.1, 1.2, 2.1, 2.3_
  - [x] 1.2 Update TypeScript types in lib/types.ts
    - Add SubscriptionPlan interface
    - Add PlanFeature interface
    - Add SubscriptionPlanWithFeatures interface
    - _Requirements: 7.1, 7.2_
  - [x] 1.3 Create seed data SQL for initial plans (free, pro, enterprise)
    - Insert default plans matching current hardcoded values
    - Insert features for each plan
    - _Requirements: 1.1_

- [x] 2. Implement plan utility functions
  - [x] 2.1 Create lib/plan-utils.ts with database query functions
    - Implement getActivePlans() to fetch active plans with features
    - Implement getPlanById(id) to fetch single plan
    - Implement getPlanByPriceId(priceId) for webhook mapping
    - Ensure plans are sorted by sort_order
    - Ensure features are sorted by sort_order
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 6.4_
  - [ ]\* 2.2 Write property test for active plan filtering
    - **Property 2: Active Plan Filtering**
    - **Validates: Requirements 1.3, 5.3**
  - [ ]\* 2.3 Write property test for plan sort order
    - **Property 3: Plan Sort Order**
    - **Validates: Requirements 1.4**
  - [ ]\* 2.4 Write property test for feature sort order
    - **Property 4: Feature Sort Order**
    - **Validates: Requirements 2.2**
  - [ ]\* 2.5 Write property test for plan-feature relationship
    - **Property 5: Plan-Feature Relationship**
    - **Validates: Requirements 2.1**

- [x] 3. Create plans API endpoint
  - [x] 3.1 Create app/api/stripe/plans/route.ts
    - Implement GET handler to return active plans with features
    - Handle database errors with 500 response
    - Return empty array if no plans found
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]\* 3.2 Write property test for plan structure completeness
    - **Property 1: Plan Structure Completeness**
    - **Validates: Requirements 1.2, 2.3, 4.2, 7.2**

- [x] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update checkout flow to use database
  - [x] 5.1 Update app/api/stripe/checkout route to use database lookup
    - Replace environment variable lookup with getPlanById()
    - Return 400 error for invalid plan_id
    - Return 400 error if stripe_price_id is missing
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]\* 5.2 Write property test for checkout price ID retrieval
    - **Property 6: Checkout Price ID Retrieval**
    - **Validates: Requirements 6.1, 6.3**

- [x] 6. Update webhook to use database mapping
  - [x] 6.1 Update app/api/stripe/webhook/route.ts to use getPlanByPriceId()
    - Replace hardcoded price ID mapping with database lookup
    - Handle unknown price IDs gracefully
    - _Requirements: 6.4_
  - [ ]\* 6.2 Write property test for webhook plan mapping
    - **Property 7: Webhook Plan Mapping**
    - **Validates: Requirements 6.4**

- [x] 7. Update pricing page to use dynamic data
  - [x] 7.1 Create hooks/use-plans.ts for fetching plans
    - Implement usePlans hook with loading/error states
    - Cache plans data appropriately
    - _Requirements: 3.1_
  - [x] 7.2 Update app/pricing/page.tsx to use dynamic plans
    - Remove hardcoded PLANS constant
    - Fetch plans using usePlans hook
    - Handle loading state with skeleton UI
    - Handle error state with error message
    - Render plans dynamically based on database data
    - Apply is_highlighted styling conditionally
    - Use cta_text and cta_type for button rendering
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.1, 5.2, 5.3, 5.4_

- [x] 8. Update lib/stripe-client.ts
  - [x] 8.1 Remove hardcoded SUBSCRIPTION_PLANS constant
    - Remove static plan definitions
    - Update getPlanFromPriceId to use database lookup
    - Keep getStripeClient function unchanged
    - _Requirements: 6.4_

- [x] 9. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ]\* 10. Write data freshness property test
  - **Property 8: Data Freshness**
  - **Validates: Requirements 5.1, 5.2**

- [x] 11. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
