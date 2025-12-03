# Customer Dashboard Design Document

## Overview

The Customer Dashboard is a React component that provides users with a comprehensive view of their article generation system. It fetches data from a REST API endpoint and displays metrics, subjects queue, recent articles, delivery settings, and writing style configuration. The dashboard follows the existing project architecture using Next.js App Router, shadcn/ui components, and Supabase for data persistence.

## Architecture

```mermaid
graph TB
    subgraph "Frontend (React)"
        DP[DashboardPage]
        MC[MetricCard]
        DC[DeliverySettingsCard]
        WSC[WritingStyleCard]
        TQ[TopicsQueue]
        RA[RecentArticles]
    end

    subgraph "API Layer"
        API[/api/dashboard/metrics]
    end

    subgraph "Data Layer"
        SB[(Supabase)]
        UP[user_profiles]
        OD[onboarding_data]
        AR[articles]
    end

    DP --> MC
    DP --> DC
    DP --> WSC
    DP --> TQ
    DP --> RA

    DP -->|GET| API
    API --> SB
    SB --> UP
    SB --> OD
    SB --> AR
```

## Components and Interfaces

### DashboardPage Component

The main page component that orchestrates data fetching and renders child components.

```typescript
interface DashboardData {
  profile: {
    display_name: string
    email: string
    preferred_language: string
  }
  onboarding: {
    style_samples: string[]
    subjects: string[]
    delivery_days: string[]
  }
  metrics: {
    articles_generated: number
    articles_sent: number
    draft_articles: number
  }
  recentArticles: Array<{
    id: string
    subject: string
    status: 'draft' | 'pending' | 'sent'
    generated_at: string
    sent_at: string | null
  }>
}
```

### MetricCard Component

Displays individual metrics with optional trend indicators.

```typescript
interface MetricCardProps {
  title: string
  value: number
  description: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
}
```

### Helper Functions

#### getStatusBadgeVariant

Maps article status to badge variant for consistent styling.

```typescript
function getStatusBadgeVariant(
  status: 'draft' | 'pending' | 'sent'
): 'default' | 'secondary' | 'outline'
```

#### getLanguageInfo

Maps language codes to display labels and flag emojis.

```typescript
function getLanguageInfo(code: string): { label: string; flag: string }
```

#### formatDeliveryDays

Formats delivery days array for display, handling the "Everyday" case.

```typescript
function formatDeliveryDays(days: string[]): string[] | 'Everyday'
```

## Data Models

### User Profile (from Supabase)

```typescript
interface UserProfile {
  id: string
  email: string
  display_name: string
  preferred_language: string
  // ... other fields
}
```

### Onboarding Data (from Supabase)

```typescript
interface OnboardingData {
  user_id: string
  style_samples: string[]
  subjects: string[]
  delivery_days: string[]
  // ... other fields
}
```

### Article (from Supabase)

```typescript
interface Article {
  id: string
  user_id: string
  subject: string
  status: 'draft' | 'pending' | 'sent' | 'archived'
  generated_at: string | null
  sent_at: string | null
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Based on the prework analysis, the following properties can be combined and consolidated:

### Property Reflection

After analyzing the acceptance criteria, several properties can be consolidated:

- Properties 1.1-1.4 all test that metric values are correctly displayed - can be combined into one property about metrics display
- Properties 4.1-4.3 and 4.5 test that profile/settings data is displayed - can be combined into one property about settings display
- Properties 3.3-3.5 test badge variant mapping - can be combined into one property about status-to-variant mapping
- Properties 2.1-2.2 test subjects queue display logic - can be combined

### Consolidated Properties

**Property 1: Metrics display correctness**
_For any_ valid DashboardData object, the rendered dashboard SHALL display the exact values of articles_generated, articles_sent, draft_articles, and subjects.length in the corresponding metric cards.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

**Property 2: Subjects queue truncation**
_For any_ subjects array with length > 8, the dashboard SHALL display exactly 8 subject items and show a message indicating (subjects.length - 8) remaining items.
**Validates: Requirements 2.2**

**Property 3: Subjects numbering**
_For any_ non-empty subjects array, each displayed subject SHALL be prefixed with its 1-based index number.
**Validates: Requirements 2.1**

**Property 4: Recent articles limit**
_For any_ recentArticles array, the dashboard SHALL display at most 5 articles, specifically the first 5 elements of the array.
**Validates: Requirements 3.1**

**Property 5: Article display completeness**
_For any_ article in the displayed list, the rendered output SHALL contain the article's subject, a formatted version of generated_at date, and the status value.
**Validates: Requirements 3.2**

**Property 6: Status badge variant mapping**
_For any_ article status value, the badge variant SHALL be: "default" for "sent", "secondary" for "pending", and "outline" for "draft".
**Validates: Requirements 3.3, 3.4, 3.5**

**Property 7: Profile data display**
_For any_ valid profile object, the dashboard SHALL display the email, display_name, and preferred_language (with corresponding flag emoji) in the delivery settings card.
**Validates: Requirements 4.1, 4.2, 4.5**

**Property 8: Delivery days display**
_For any_ delivery_days array with length < 7, each day SHALL be displayed as an individual badge. When length === 7, a single "Everyday" badge SHALL be displayed instead.
**Validates: Requirements 4.3, 4.4**

**Property 9: Style samples count display**
_For any_ style_samples array, the dashboard SHALL display style_samples.length as the training count.
**Validates: Requirements 5.1**

**Property 10: Error message display**
_For any_ error state with a message, the dashboard SHALL display that error message in the error UI.
**Validates: Requirements 6.1**

**Property 11: Data freshness on user change**
_For any_ change to the user object, the dashboard SHALL trigger a new API fetch to refresh all displayed data.
**Validates: Requirements 7.2, 7.3**

## Error Handling

### API Errors

- Display user-friendly error message in a styled alert component
- Log detailed error to console for debugging
- Maintain error state to prevent rendering of data components

### Authentication Errors

- ProtectedRoute component handles redirect to login
- Dashboard does not render content for unauthenticated users

### Data Validation

- Handle missing or null data gracefully with fallback values
- Empty arrays default to empty state UI
- Missing profile fields show placeholder text

## Testing Strategy

### Property-Based Testing

The project will use **fast-check** for property-based testing in TypeScript/JavaScript.

Configuration:

- Minimum 100 iterations per property test
- Tests tagged with format: `**Feature: customer-dashboard, Property {number}: {property_text}**`

### Unit Tests

Unit tests will cover:

- Helper function behavior (getStatusBadgeVariant, getLanguageInfo, formatDeliveryDays)
- Component rendering with various data states
- Edge cases (empty arrays, null values)

### Test File Location

Tests will be co-located with source files:

- `lib/dashboard-utils.test.ts` - Helper function tests
- Component tests in respective component directories

### Testing Approach

1. Extract pure logic into testable utility functions
2. Write property-based tests for data transformation logic
3. Write unit tests for specific examples and edge cases
4. Use React Testing Library for component behavior tests (optional)
