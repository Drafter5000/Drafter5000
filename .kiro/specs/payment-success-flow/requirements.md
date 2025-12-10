# Requirements Document

## Introduction

This document specifies the requirements for fixing the payment success flow after Stripe checkout completion. Currently, after a successful payment from the subscribe page, users are redirected back to the pricing selection screen instead of seeing a proper verification flow that activates their pending article style and syncs data to Google Sheets.

The fix should restore the previous behavior where users see a "Verifying payment" page with animated progress indicators showing the steps: verifying payment, activating style, syncing to database and Google Sheets, then auto-redirecting to the dashboard.

## Glossary

- **Pending Style**: An article style record created during signup with `status: 'pending'` and `is_active: false`, waiting to be activated after payment
- **Style Activation**: The process of updating a pending style to `is_active: true` and `status: 'active'`
- **Google Sheets Sync**: The process of appending user style data to the main Google Sheet and creating a customer-specific sheet with topics
- **Checkout Session**: A Stripe checkout session containing payment and subscription information
- **Session ID**: The unique identifier for a Stripe checkout session, passed as a URL parameter after successful payment

## Requirements

### Requirement 1

**User Story:** As a user who just completed payment, I want to see a verification progress screen, so that I know my payment is being processed and my account is being set up.

#### Acceptance Criteria

1. WHEN a user returns from Stripe checkout with a session_id parameter THEN the Subscribe_Page SHALL display a payment verification screen instead of the pricing selection
2. WHEN the verification screen is displayed THEN the System SHALL show animated progress indicators for each setup step
3. WHEN verification is in progress THEN the System SHALL display the current step being processed with a loading animation
4. WHEN all verification steps complete successfully THEN the System SHALL automatically redirect to the dashboard within 2 seconds
5. IF verification fails THEN the System SHALL display an error message with a retry option

### Requirement 2

**User Story:** As a user with a pending article style, I want my style to be activated after payment, so that I can start receiving personalized articles.

#### Acceptance Criteria

1. WHEN payment verification succeeds THEN the System SHALL query for pending article styles belonging to the user
2. WHEN a pending style exists THEN the System SHALL update the style record to set is_active to true and status to active
3. WHEN style activation completes THEN the System SHALL display a success indicator for the activation step
4. IF no pending style exists THEN the System SHALL skip the activation step and continue with the flow

### Requirement 3

**User Story:** As a user, I want my article style data synced to Google Sheets after payment, so that the article generation system can access my preferences.

#### Acceptance Criteria

1. WHEN style activation completes THEN the System SHALL initiate Google Sheets synchronization
2. WHEN syncing to Google Sheets THEN the System SHALL append user data to the Main Sheet with all required fields
3. WHEN syncing to Google Sheets THEN the System SHALL create a customer-specific sheet with the user's topics
4. WHEN Google Sheets sync completes THEN the System SHALL display a success indicator for the sync step
5. IF Google Sheets sync fails THEN the System SHALL log the error and continue with the flow without blocking the user

### Requirement 4

**User Story:** As a user, I want to see clear progress of each setup step, so that I understand what is happening with my account.

#### Acceptance Criteria

1. WHEN the verification screen loads THEN the System SHALL display a list of setup steps with pending status
2. WHEN each step begins processing THEN the System SHALL update that step's status to in-progress with a spinner animation
3. WHEN each step completes THEN the System SHALL update that step's status to complete with a checkmark icon
4. WHEN all steps complete THEN the System SHALL display a success message indicating the account is ready
5. WHEN displaying progress THEN the System SHALL show step labels: Verifying Payment, Activating Your Style, Syncing Your Data, and Setup Complete

### Requirement 5

**User Story:** As a user, I want to be redirected to the dashboard after successful setup, so that I can start using the application.

#### Acceptance Criteria

1. WHEN all setup steps complete successfully THEN the System SHALL display a countdown message before redirect
2. WHEN the countdown completes THEN the System SHALL redirect the user to the dashboard page
3. WHEN redirecting to dashboard THEN the System SHALL include a payment_success parameter to show a welcome message
4. IF the user clicks a manual redirect button THEN the System SHALL immediately redirect to the dashboard
