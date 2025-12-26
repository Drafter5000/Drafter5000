# Design Document: Admin Plan Management

## Overview

This feature extends the existing admin dashboard with comprehensive subscription plan management capabilities. Administrators can view, create, edit, enable/disable, and manage features for all subscription plans. The system includes a default admin user (admin@drafter.com) with password reset functionality.

## Architecture

The feature follows the existing Next.js App Router architecture with:

- Server-side API routes for data operations
- Client-side React components for the UI
- Supabase for database operations
- Optional Stripe integration for paid plans

```mermaid
graph TB
    subgraph "Admin UI"
        PL[Plans List Page]
        PE[Plan Edit Page]
        PC[Plan Create Page]
        SP[Settings Page]
    end

    subgraph "API Routes"
        AP[/api/admin/plans]
        APF[/api/admin/plans/features]
        APS[/api/admin/settings/password]
    end

    subgraph "Services"
        PS[Plan Service]
        AS[Admin Service]
    end

    subgraph "Data Layer"
        DB[(Supabase)]
        ST[Stripe API]
    end

    PL --> AP
    PE --> AP
    PC --> AP
    PE --> APF
    SP --> APS

    AP --> PS
    APF --> PS
    APS --> AS

    PS --> DB
    PS --> ST
    AS --> DB
```

## Components and Interfaces

### New Pages

1. **Plans List Page** (`/admin/plans`)
   - Displays all plans in a table with status indicators
   - Quick toggle for active/visible status
   - Links to edit and create pages

2. **Plan Edit Page** (`/admin/plans/[id]/edit`)
   - Form for editing all plan properties
   - Feature management section
   - Stripe sync option

3. **Plan Create Page** (`/admin/plans/new`)
   - Form for creating new plans
   - Stripe product/price creation option

4. **Settings Page Enhancement** (`/admin/settings`)
   - Password reset section for admin user

### New Components

1. **PlanTable** - Displays plans in a sortable table
2. **PlanForm** - Reusable form for create/edit
3. **PlanFeatureManager** - Manages plan features with drag-and-drop
4. **PasswordResetForm** - Form for changing admin password

### API Endpoints

| Endpoint                                     | Method | Description                  |
| -------------------------------------------- | ------ | ---------------------------- |
| `/api/admin/plans`                           | GET    | List all plans with features |
| `/api/admin/plans`                           | POST   | Create new plan              |
| `/api/admin/plans/[id]`                      | GET    | Get single plan              |
| `/api/admin/plans/[id]`                      | PATCH  | Update plan                  |
| `/api/admin/plans/[id]`                      | DELETE | Soft delete plan             |
| `/api/admin/plans/[id]/features`             | GET    | List plan features           |
| `/api/admin/plans/[id]/features`             | POST   | Add feature                  |
| `/api/admin/plans/[id]/features/[featureId]` | DELETE | Remove feature               |
| `/api/admin/plans/[id]/features/reorder`     | POST   | Reorder features             |
| `/api/admin/settings/password`               | POST   | Reset admin password         |

## Data Models

### Existing Models (from types.ts)

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
  is_visible: boolean;
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
```

### New Types

```typescript
interface UpdatePlanInput {
  name?: string;
  description?: string;
  price_cents?: number;
  currency?: string;
  articles_per_month?: number;
  is_active?: boolean;
  is_visible?: boolean;
  is_highlighted?: boolean;
  sort_order?: number;
  cta_text?: string;
  cta_type?: 'checkout' | 'email' | 'signup';
  sync_to_stripe?: boolean;
}

interface CreatePlanInput {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  currency?: string;
  articles_per_month: number;
  is_active?: boolean;
  is_visible?: boolean;
  is_highlighted?: boolean;
  sort_order?: number;
  cta_text?: string;
  cta_type?: 'checkout' | 'email' | 'signup';
  sync_to_stripe?: boolean;
}

interface PasswordResetInput {
  current_password: string;
  new_password: string;
  confirm_password: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Based on the prework analysis, the following properties have been identified:

### Property 1: Plan list ordering consistency

_For any_ list of subscription plans returned by the API, the plans SHALL be ordered by sort_order in ascending order.
**Validates: Requirements 1.4**

### Property 2: Plan update persistence

_For any_ valid plan update request, the updated fields SHALL be persisted to the database and returned in subsequent GET requests with the same values.
**Validates: Requirements 2.2**

### Property 3: Invalid plan data rejection

_For any_ plan update or create request with invalid data (missing required fields, invalid types), the System SHALL reject the request and return a validation error without modifying the database.
**Validates: Requirements 2.4**

### Property 4: Active status toggle persistence

_For any_ plan, toggling the is_active field SHALL persist the new value to the database.
**Validates: Requirements 3.1**

### Property 5: Visibility toggle persistence

_For any_ plan, toggling the is_visible field SHALL persist the new value to the database.
**Validates: Requirements 4.1**

### Property 6: Hidden plan exclusion from public API

_For any_ plan with is_visible=false, the plan SHALL NOT appear in the public pricing API response.
**Validates: Requirements 4.2**

### Property 7: Feature display completeness

_For any_ plan with N features, the API response SHALL include exactly N features with matching feature_text values.
**Validates: Requirements 5.1**

### Property 8: Feature addition persistence

_For any_ valid feature addition request, a new plan_feature record SHALL be created with the specified text and plan_id.
**Validates: Requirements 5.2**

### Property 9: Feature deletion persistence

_For any_ feature deletion request, the plan_feature record SHALL be removed from the database.
**Validates: Requirements 5.3**

### Property 10: Password validation rules

_For any_ password string, the validation function SHALL return true only if the password contains at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.
**Validates: Requirements 7.2**

### Property 11: Plan creation persistence

_For any_ valid plan creation request, a new subscription_plan record SHALL be created with all specified fields.
**Validates: Requirements 8.2**

## Error Handling

| Error Scenario      | Response Code | User Message                          |
| ------------------- | ------------- | ------------------------------------- |
| Unauthorized access | 401           | "Unauthorized"                        |
| Plan not found      | 404           | "Plan not found"                      |
| Validation error    | 400           | Specific field errors                 |
| Database error      | 500           | "Failed to update plan"               |
| Stripe sync error   | 500           | "Failed to sync with Stripe"          |
| Invalid password    | 400           | "Password does not meet requirements" |

## Testing Strategy

### Unit Tests

- Password validation function
- Plan data validation
- Sort order comparison

### Property-Based Tests

Using fast-check library for TypeScript:

1. **Plan ordering property** - Generate random plans with sort_orders, verify ordering
2. **Plan update round-trip** - Update plan, fetch, verify fields match
3. **Validation rejection** - Generate invalid inputs, verify rejection
4. **Feature CRUD operations** - Add/remove features, verify database state
5. **Password validation** - Generate passwords, verify validation rules

### Integration Tests

- Full plan CRUD flow
- Feature management flow
- Password reset flow
- Stripe sync (mocked)
