# Requirements Document

## Introduction

This feature implements dynamic statistics on the landing page that reflect real usage data from the platform. Currently, the landing page displays hardcoded numbers (12,847 articles in the demo box, 50,000+ in the stats section). This feature will replace these static values with dynamically calculated metrics based on actual customer data.

The calculation formula for estimated articles is: `Number of active customers × Number of weeks active × Number of delivery days selected in Step 3`

## Glossary

- **Landing Page**: The public-facing homepage at `/` that displays marketing content and statistics
- **Active Customer**: A user with an active subscription status (`active` or `trialing`)
- **Delivery Days**: The days of the week a customer has selected to receive articles (stored in `article_styles.delivery_days`)
- **Weeks Active**: The number of weeks since a customer's subscription started
- **Stats Section**: The component displaying platform statistics (Articles Generated, Happy Writers, etc.)
- **Hero Visual**: The floating card in the hero section showing "Articles Generated" count

## Requirements

### Requirement 1

**User Story:** As a visitor, I want to see consistent article statistics across the landing page, so that I can trust the displayed numbers are accurate.

#### Acceptance Criteria

1. WHEN the landing page loads THEN the System SHALL display the same article count in both the hero visual card and the stats section
2. WHEN calculating article statistics THEN the System SHALL use the formula: sum of (weeks_active × delivery_days_count) for each active customer
3. WHEN displaying article counts THEN the System SHALL format numbers with appropriate suffixes (e.g., "13+" for values over 10)

### Requirement 2

**User Story:** As a visitor, I want to see the real number of happy writers, so that I can understand the platform's actual user base.

#### Acceptance Criteria

1. WHEN the landing page loads THEN the System SHALL display the actual count of customers with active subscriptions
2. WHEN counting happy writers THEN the System SHALL include users with subscription_status of 'active' or 'trialing'
3. WHEN displaying customer counts THEN the System SHALL format numbers appropriately (e.g., "5+" for small numbers)

### Requirement 3

**User Story:** As a developer, I want the landing page statistics to be fetched efficiently, so that page load performance is not degraded.

#### Acceptance Criteria

1. WHEN fetching landing page statistics THEN the System SHALL use a single API endpoint to retrieve all metrics
2. WHEN the API endpoint is called THEN the System SHALL return both article estimates and customer counts in one response
3. WHEN calculating statistics THEN the System SHALL query the database efficiently using aggregation queries

### Requirement 4

**User Story:** As a visitor, I want the statistics to load gracefully, so that I see a smooth experience even while data is being fetched.

#### Acceptance Criteria

1. WHEN statistics are loading THEN the System SHALL display placeholder values or loading states
2. WHEN statistics fail to load THEN the System SHALL display reasonable fallback values
3. WHEN statistics are successfully loaded THEN the System SHALL animate the counter from the fallback to the actual value
