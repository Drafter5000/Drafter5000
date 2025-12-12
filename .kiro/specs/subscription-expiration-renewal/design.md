# Design Document: Subscription Expiration and Renewal

## Overview

This feature implements comprehensive handling for subscription expiration scenarios in the Drafter application. When a user's subscription expires (due to payment failure, cancellation, or period end), the system will:

1. Detect and track the expired state via Stripe webhooks
2. Display clear expiration messaging with the expiration date
3. Disable all feature-related functionality (article generation, style editing)
4. Provide prominent renewal buttons that redirect to Stripe Customer Portal
5. Automatically re-enable features upon successful renewal

The implementation leverages the existing Stripe integration and extends the current subscription status handling to provide a seamless expiration and renewal experience.

## Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Dashboard[Dashboard Page]
        Billing[Billing Page]
        Features[Feature Components]
    end

    subgraph Hooks["React Hooks"]
        useSubscription[useSubscriptionStatus Hook]
    end

    subgraph API["API Layer"]
        SubscriptionAPI[/api/stripe/subscription]
        PortalAPI[/api/stripe/portal]
        WebhookAPI[/api/stripe/webhook]
    end

    subgraph Services["Service Layer"]
        SubscriptionService[Subscription Service]
        BillingService[Billing Service]
    end

    subgraph External["External Services"]
        Stripe[Stripe API]
        StripePortal[Stripe Customer Portal]
    end

    subgraph Database["Database"]
        UserProfiles[(user_profiles)]
        Subscriptions[(subscriptions)]
    end

    Dashboard --> useSubscription
    Billing --> useSubscription
    Features --> useSubscription

    useSubscription --> SubscriptionAPI
    Dashboard --> PortalAPI
    Billing --> PortalAPI

    SubscriptionAPI --> SubscriptionService
    PortalAPI --> BillingService
    WebhookAPI --> SubscriptionService

    SubscriptionService --> UserProfiles
    SubscriptionService --> Subscriptions
    BillingService --> Stripe

    Stripe --> WebhookAPI
    PortalAPI --> StripePortal
```

## Components and Interfaces

### 1. Subscription Status Utilities

**File:** `lib/subscription-utils.ts`

```typescript
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export interface SubscriptionState {
  status: SubscriptionStatus;
  isExpired: boolean;
  expirationDate: Date | null;
  canAccessFeatures: boolean;
}

export function isSubscriptionExpired(status: SubscriptionStatus): boolean;
export function getSubscriptionState(
  profile: UserProfile,
  subscription?: SubscriptionData
): SubscriptionState;
export function getExpirationMessage(state: SubscriptionState): string;
```

### 2. Subscription Status Hook

**File:** `lib/hooks/use-subscription-status.ts`

```typescript
export interface UseSubscriptionStatusReturn {
  status: SubscriptionStatus;
  isExpired: boolean;
  isLoading: boolean;
  expirationDate: Date | null;
  canAccessFeatures: boolean;
  refetch: () => Promise<void>;
}

export function useSubscriptionStatus(): UseSubscriptionStatusReturn;
```

### 3. Expiration Banner Component

**File:** `components/subscription-expiration-banner.tsx`

```typescript
export interface ExpirationBannerProps {
  expirationDate: Date | null;
  onRenewClick: () => void;
  isRenewing: boolean;
}

export function SubscriptionExpirationBanner(props: ExpirationBannerProps): JSX.Element;
```

### 4. Renewal Modal Component

**File:** `components/renewal-modal.tsx`

```typescript
export interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRenew: () => void;
  isLoading: boolean;
}

export function RenewalModal(props: RenewalModalProps): JSX.Element;
```

### 5. Feature Gate Component

**File:** `components/feature-gate.tsx`

```typescript
export interface FeatureGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showTooltip?: boolean;
  tooltipMessage?: string;
}

export function FeatureGate(props: FeatureGateProps): JSX.Element;
```

### 6. API Endpoints

**Enhanced Portal Endpoint:** `app/api/stripe/portal/route.ts`

- Already exists, no changes needed - creates Stripe Customer Portal session

**Enhanced Subscription Endpoint:** `app/api/stripe/subscription/route.ts`

- Add `expiration_date` field to response
- Add `is_expired` computed field

## Data Models

### User Profile (Existing - No Changes)

```typescript
interface UserProfile {
  id: string;
  subscription_status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  subscription_plan: 'free' | 'pro' | 'enterprise';
  stripe_customer_id: string | null;
  // ... other fields
}
```

### Subscription Record (Existing - Enhanced)

```typescript
interface Subscription {
  user_id: string;
  stripe_subscription_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string; // Used as expiration date
  cancel_at: string | null;
  canceled_at: string | null;
  // ... other fields
}
```

### Subscription API Response (Enhanced)

```typescript
interface SubscriptionResponse {
  plan: string;
  status: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  canceled_at?: number;
  is_expired: boolean; // NEW
  expiration_date?: string; // NEW - ISO date string
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Subscription expiration check consistency

_For any_ subscription status value, the `isSubscriptionExpired` function SHALL return `true` if and only if the status is "past_due" or "canceled", and `false` for all other valid status values ("active", "trialing", "incomplete").

**Validates: Requirements 5.4**

### Property 2: Feature disabling for expired subscriptions

_For any_ user with an expired subscription status (past_due or canceled), all feature access checks SHALL return disabled state, and the tooltip message SHALL contain "Subscription required to access this feature".

**Validates: Requirements 2.1, 2.2, 2.4**

### Property 3: Expiration message includes required information

_For any_ expired subscription state with a valid expiration date, the rendered expiration message SHALL contain both the expiration status indicator and the formatted expiration date.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 4: Portal session return URL configuration

_For any_ portal session creation request, the generated Stripe portal session SHALL have a return_url that ends with "/dashboard/billing".

**Validates: Requirements 3.2**

### Property 5: Webhook status mapping correctness

_For any_ Stripe webhook event of type "invoice.payment*failed", the resulting subscription status SHALL be "past_due". \_For any* webhook event of type "customer.subscription.deleted", the resulting status SHALL be "canceled". _For any_ webhook event of type "invoice.payment_succeeded", the resulting status SHALL be "active".

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 6: Usage display for expired subscriptions

_For any_ user with an expired subscription, the usage display SHALL show remaining tokens as 0 and the usage data SHALL be marked as read-only.

**Validates: Requirements 6.1, 6.2**

## Error Handling

### Portal Session Creation Failures

- If Stripe Customer Portal session creation fails, display an error toast with retry option
- Log the error for debugging purposes
- Provide fallback link to Stripe dashboard if portal is unavailable

### Webhook Processing Failures

- Webhook failures are logged but return 200 to prevent Stripe retries for non-recoverable errors
- Critical failures (database updates) are logged with `MANUAL_RECOVERY_NEEDED` prefix
- Subscription status mismatches are reconciled on next user login

### Network Errors

- Subscription status checks fail gracefully, defaulting to cached state
- Renewal button shows loading state during portal redirect
- Timeout errors display user-friendly message with retry option

## Testing Strategy

### Unit Testing

Unit tests will verify:

- `isSubscriptionExpired` function returns correct boolean for all status values
- `getSubscriptionState` correctly computes derived state
- `getExpirationMessage` formats messages correctly
- Component rendering based on subscription state

### Property-Based Testing

Property-based tests will use **fast-check** library to verify:

- Subscription status classification is consistent across all valid inputs
- Feature gate behavior is deterministic based on subscription state
- Webhook event processing produces correct status updates
- Portal URL generation always includes correct return path

Each property-based test will:

- Run a minimum of 100 iterations
- Be tagged with the corresponding correctness property reference
- Use generators that produce valid subscription states and webhook payloads

### Integration Testing

Integration tests will verify:

- End-to-end renewal flow from expired state to active
- Webhook processing updates database correctly
- UI components respond to subscription state changes
