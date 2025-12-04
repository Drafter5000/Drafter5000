# Design Document: Dynamic Stripe Pricing

## Overview

This design transforms the hardcoded subscription pricing system into a database-driven solution. The current implementation stores plan data in `lib/stripe-client.ts` and `app/pricing/page.tsx` as static constants. The new design introduces database tables for plans and features, an API endpoint for fetching plans, and updates to the pricing page and checkout flow to use dynamic data.

## Architecture

```mermaid
graph TB
    subgraph Database
        SP[subscription_plans table]
        PF[plan_features table]
    end

    subgraph API Layer
        PA[/api/stripe/plans]
        CO[/api/stripe/checkout]
        WH[/api/stripe/webhook]
    end

    subgraph Frontend
        PP[Pricing Page]
        BP[Billing Page]
    end

    subgraph External
        ST[Stripe API]
    end

    SP --> PA
    PF --> PA
    PA --> PP
    SP --> CO
    CO --> ST
    ST --> WH
    WH --> SP
    PP --> CO
```

## Components and Interfaces

### Database Schema

#### subscription_plans table

```sql
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  articles_per_month INTEGER NOT NULL,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  cta_text TEXT,
  cta_type TEXT DEFAULT 'checkout' CHECK (cta_type IN ('checkout', 'email', 'signup')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### plan_features table

```sql
CREATE TABLE plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### GET /api/stripe/plans

Returns all active subscription plans with their features.

**Response:**

```typescript
{
  plans: SubscriptionPlanWithFeatures[]
}
```

#### POST /api/stripe/checkout (updated)

Uses database lookup for stripe_price_id instead of environment variables.

### Components

#### PricingPage (updated)

- Fetches plans from `/api/stripe/plans` on mount
- Renders plans dynamically based on database data
- Handles loading and error states

#### lib/plan-utils.ts (new)

- `getActivePlans()`: Fetches active plans from database
- `getPlanById(id)`: Fetches single plan by ID
- `getPlanByPriceId(priceId)`: Maps Stripe price ID to plan

## Data Models

### TypeScript Interfaces

```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  articles_per_month: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  is_active: boolean;
  is_highlighted: boolean;
  sort_order: number;
  cta_text: string | null;
  cta_type: 'checkout' | 'email' | 'signup';
  created_at: string;
  updated_at: string;
}

interface PlanFeature {
  id: string;
  plan_id: string;
  feature_text: string;
  sort_order: number;
  created_at: string;
}

interface SubscriptionPlanWithFeatures extends SubscriptionPlan {
  features: PlanFeature[];
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Plan Structure Completeness

_For any_ subscription plan returned by the system, the plan object SHALL contain all required fields: id, name, price_cents, currency, articles_per_month, is_active, is_highlighted, sort_order, and a features array where each feature has id, plan_id, feature_text, and sort_order.

**Validates: Requirements 1.2, 2.3, 4.2, 7.2**

### Property 2: Active Plan Filtering

_For any_ set of plans in the database with varying is_active values, the getActivePlans function SHALL return only plans where is_active equals true.

**Validates: Requirements 1.3, 5.3**

### Property 3: Plan Sort Order

_For any_ set of active plans returned by the system, the plans SHALL be ordered by sort_order in ascending order.

**Validates: Requirements 1.4**

### Property 4: Feature Sort Order

_For any_ plan with multiple features, the features array SHALL be ordered by sort_order in ascending order.

**Validates: Requirements 2.2**

### Property 5: Plan-Feature Relationship

_For any_ plan with associated features in the database, retrieving that plan SHALL include all and only the features where plan_id matches the plan's id.

**Validates: Requirements 2.1**

### Property 6: Checkout Price ID Retrieval

_For any_ valid plan_id passed to checkout, the system SHALL retrieve and use the stripe_price_id from the database record matching that plan_id.

**Validates: Requirements 6.1, 6.3**

### Property 7: Webhook Plan Mapping

_For any_ Stripe price_id received in a webhook event, the system SHALL correctly map it to the plan where stripe_price_id matches.

**Validates: Requirements 6.4**

### Property 8: Data Freshness

_For any_ update to a plan's price_cents, articles_per_month, or features in the database, subsequent calls to getActivePlans SHALL return the updated values.

**Validates: Requirements 5.1, 5.2**

## Error Handling

| Scenario                              | Response                                                 |
| ------------------------------------- | -------------------------------------------------------- |
| Database connection failure           | 500 with `{ error: "Failed to fetch plans" }`            |
| Invalid plan_id in checkout           | 400 with `{ error: "Invalid plan selected" }`            |
| Missing stripe_price_id for paid plan | 400 with `{ error: "Plan not configured for checkout" }` |
| No active plans found                 | 200 with `{ plans: [] }`                                 |

## Testing Strategy

### Property-Based Testing Library

Use `fast-check` for property-based testing in TypeScript/JavaScript.

### Property-Based Tests

Each correctness property will be implemented as a property-based test using fast-check:

1. **Plan Structure Test**: Generate random plan data, insert into mock/test database, retrieve via API, verify all required fields present
2. **Active Filtering Test**: Generate plans with random is_active values, verify only active plans returned
3. **Plan Sort Order Test**: Generate plans with random sort_orders, verify output is sorted ascending
4. **Feature Sort Order Test**: Generate features with random sort_orders, verify output is sorted ascending
5. **Plan-Feature Relationship Test**: Generate plans with random features, verify correct features returned for each plan
6. **Checkout Price ID Test**: Generate plans with price IDs, verify checkout retrieves correct price_id
7. **Webhook Mapping Test**: Generate plans with price IDs, verify webhook correctly maps price_id to plan
8. **Data Freshness Test**: Generate plan, update values, verify updated values returned

### Test Configuration

- Minimum 100 iterations per property test
- Each test tagged with: `**Feature: dynamic-stripe-pricing, Property {number}: {property_text}**`

### Unit Tests

- API route handlers for success and error cases
- Plan utility functions
- Database query functions
