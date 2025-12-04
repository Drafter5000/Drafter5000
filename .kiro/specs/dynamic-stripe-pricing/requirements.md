# Requirements Document

## Introduction

This feature transforms the currently hardcoded Stripe subscription pricing system into a dynamic, database-driven solution. Administrators will be able to manage subscription plans (create, update, enable/disable) through the database, and the pricing page and billing logic will automatically reflect these changes without code deployments.

## Glossary

- **Subscription Plan**: A pricing tier that defines the cost, features, and usage limits for users (e.g., Free, Pro, Enterprise)
- **Plan Feature**: A specific capability or benefit included in a subscription plan
- **Stripe Price ID**: The unique identifier from Stripe that links a plan to its payment configuration
- **Stripe Product ID**: The unique identifier from Stripe that represents the product associated with a plan
- **Articles Per Month**: The monthly usage limit for article generation based on subscription tier
- **Active Plan**: A subscription plan that is currently available for purchase
- **Highlighted Plan**: A plan marked as "most popular" or recommended in the UI

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to store subscription plans in the database, so that I can manage pricing without code changes.

#### Acceptance Criteria

1. WHEN the system initializes THEN the System SHALL load subscription plans from the `subscription_plans` database table
2. WHEN a subscription plan record exists in the database THEN the System SHALL include fields for id, name, description, price_cents, currency, articles_per_month, stripe_product_id, stripe_price_id, is_active, is_highlighted, and sort_order
3. WHEN a plan has is_active set to false THEN the System SHALL exclude that plan from the pricing page display
4. WHEN multiple plans exist THEN the System SHALL order plans by the sort_order field ascending

### Requirement 2

**User Story:** As a system administrator, I want to manage plan features separately, so that I can update feature lists without modifying plan records.

#### Acceptance Criteria

1. WHEN a subscription plan exists THEN the System SHALL support multiple features linked via a `plan_features` table
2. WHEN features are retrieved for a plan THEN the System SHALL order features by their sort_order field ascending
3. WHEN a feature record exists THEN the System SHALL include fields for id, plan_id, feature_text, and sort_order

### Requirement 3

**User Story:** As a user, I want to see current pricing plans on the pricing page, so that I can choose the right subscription for my needs.

#### Acceptance Criteria

1. WHEN a user visits the pricing page THEN the System SHALL fetch and display all active plans from the database
2. WHEN displaying a plan THEN the System SHALL show the plan name, description, price, articles_per_month, and all associated features
3. WHEN a plan has is_highlighted set to true THEN the System SHALL display that plan with visual emphasis and a "Most Popular" badge
4. WHEN the free plan is displayed THEN the System SHALL show "Get Started" as the call-to-action button text
5. WHEN a paid plan is displayed THEN the System SHALL show "Start Free Trial" as the call-to-action button text
6. WHEN the enterprise plan is displayed THEN the System SHALL show "Contact Sales" as the call-to-action button text and link to email

### Requirement 4

**User Story:** As a developer, I want an API endpoint to fetch subscription plans, so that the frontend can retrieve plan data dynamically.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/stripe/plans` THEN the System SHALL return all active subscription plans with their features
2. WHEN the API returns plans THEN the System SHALL include all plan fields and nested features array
3. WHEN no active plans exist THEN the System SHALL return an empty array with 200 status
4. IF the database query fails THEN the System SHALL return a 500 status with an error message

### Requirement 5

**User Story:** As a system administrator, I want to update plan details in the database, so that pricing changes reflect immediately on the website.

#### Acceptance Criteria

1. WHEN a plan's price_cents is updated in the database THEN the System SHALL display the new price on the pricing page on next load
2. WHEN a plan's features are modified THEN the System SHALL display the updated features on the pricing page on next load
3. WHEN a plan's is_active status changes to false THEN the System SHALL remove that plan from the pricing page on next load
4. WHEN a plan's is_highlighted status changes THEN the System SHALL update the visual emphasis on the pricing page on next load

### Requirement 6

**User Story:** As a developer, I want the checkout flow to use database plan data, so that Stripe integration remains consistent with displayed pricing.

#### Acceptance Criteria

1. WHEN a user initiates checkout for a plan THEN the System SHALL retrieve the stripe_price_id from the database
2. WHEN the stripe_price_id is not found for a plan THEN the System SHALL return a 400 error with message "Invalid plan selected"
3. WHEN creating a Stripe checkout session THEN the System SHALL use the stripe_price_id from the database record
4. WHEN a webhook receives a subscription event THEN the System SHALL map the price_id to the correct plan using database lookup

### Requirement 7

**User Story:** As a developer, I want TypeScript types for plan data, so that the codebase maintains type safety.

#### Acceptance Criteria

1. WHEN plan data is used in the application THEN the System SHALL enforce types via SubscriptionPlan and PlanFeature interfaces
2. WHEN API responses include plan data THEN the System SHALL return data conforming to the defined TypeScript interfaces
