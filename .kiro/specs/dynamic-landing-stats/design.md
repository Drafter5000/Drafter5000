# Design Document: Dynamic Landing Page Statistics

## Overview

This feature replaces hardcoded statistics on the landing page with dynamically calculated metrics based on real platform data. The system will calculate estimated article counts using the formula: `sum of (weeks_active × delivery_days_count)` for each active customer, and display the actual count of active subscribers as "Happy Writers".

## Architecture

```mermaid
flowchart TB
    subgraph Client
        LP[Landing Page]
        HV[HeroVisual Component]
        SS[StatsSection Component]
    end

    subgraph API
        LSE[/api/landing-stats]
    end

    subgraph Services
        LSS[Landing Stats Service]
    end

    subgraph Database
        UP[(user_profiles)]
        AS[(article_styles)]
    end

    LP --> LSE
    LSE --> LSS
    LSS --> UP
    LSS --> AS
    LSE --> HV
    LSE --> SS
```

## Components and Interfaces

### 1. Landing Stats API Endpoint

**Path:** `/api/landing-stats/route.ts`

**Method:** GET

**Response:**

```typescript
interface LandingStatsResponse {
  estimatedArticles: number;
  activeCustomers: number;
  formattedArticles: string;
  formattedCustomers: string;
}
```

### 2. Landing Stats Service

**Path:** `lib/services/landing-stats.ts`

**Functions:**

- `getLandingStats(): Promise<LandingStats>` - Main function to calculate all landing page statistics
- `calculateEstimatedArticles(customers: CustomerData[]): number` - Pure function to calculate article estimates
- `formatStatNumber(value: number): string` - Format numbers with appropriate suffixes

### 3. Updated Components

**HeroVisual Component:** Updated to accept dynamic `articleCount` prop
**StatsSection Component:** Updated to fetch and display dynamic statistics

## Data Models

### CustomerData (internal)

```typescript
interface CustomerData {
  userId: string;
  subscriptionStatus: 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete';
  createdAt: Date;
  deliveryDays: string[];
}
```

### LandingStats

```typescript
interface LandingStats {
  estimatedArticles: number;
  activeCustomers: number;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Article Calculation Formula Correctness

_For any_ set of customer data with known weeks_active and delivery_days_count values, the `calculateEstimatedArticles` function SHALL return the sum of (weeks_active × delivery_days_count) for each customer.

**Validates: Requirements 1.2**

### Property 2: Active Customer Count Accuracy

_For any_ set of user profiles with various subscription statuses, the active customer count SHALL equal the count of users where subscription_status is 'active' OR 'trialing'.

**Validates: Requirements 2.1, 2.2**

### Property 3: Number Formatting Consistency

_For any_ positive integer input, the `formatStatNumber` function SHALL return a string containing the number (possibly abbreviated) followed by a "+" suffix.

**Validates: Requirements 1.3, 2.3**

## Error Handling

| Scenario                    | Handling                                         |
| --------------------------- | ------------------------------------------------ |
| Database connection failure | Return fallback values (0 articles, 0 customers) |
| Empty customer data         | Return 0 for both metrics                        |
| Invalid delivery_days data  | Treat as 0 delivery days for that customer       |
| API timeout                 | Client displays cached/fallback values           |

## Testing Strategy

### Unit Tests

- Test `calculateEstimatedArticles` with various customer data sets
- Test `formatStatNumber` with edge cases (0, 1, 10, 100, 1000, etc.)
- Test API endpoint response structure

### Property-Based Tests

The following property-based tests will be implemented using `fast-check`:

1. **Article Calculation Property Test**
   - Generate random arrays of customer data
   - Verify calculation matches manual sum of (weeks × days)
   - Tag: **Feature: dynamic-landing-stats, Property 1: Article Calculation Formula Correctness**

2. **Active Customer Filter Property Test**
   - Generate random user profiles with various subscription statuses
   - Verify count matches filtered count of active/trialing users
   - Tag: **Feature: dynamic-landing-stats, Property 2: Active Customer Count Accuracy**

3. **Number Formatting Property Test**
   - Generate random positive integers
   - Verify output always ends with "+" and contains numeric representation
   - Tag: **Feature: dynamic-landing-stats, Property 3: Number Formatting Consistency**

### Integration Tests

- Test full API endpoint with mock database
- Test component rendering with various stat values
