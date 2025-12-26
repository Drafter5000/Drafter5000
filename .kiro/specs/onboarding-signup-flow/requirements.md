# Requirements Document

## Introduction

This document defines the requirements for a streamlined user onboarding flow that combines article style creation with user signup and payment. The flow guides anonymous users through a 3-step wizard (writing style → topics → account creation), then redirects to the pricing page for plan selection and Stripe payment. Upon successful payment, all data is persisted to the database and synchronized to Google Sheets.

Key changes from the previous implementation:

- Email verification is skipped - users can proceed immediately after account creation
- User record is saved immediately after step 3 completion (before payment)
- After signup, users are redirected to the pricing page to select a plan
- After successful Stripe payment, style data is stored in the database AND synced to Google Sheets
- Robust error handling with clear error messages and retry capability

## Glossary

- **Onboarding_Flow**: The 3-step wizard process that guides users from landing page to account creation
- **Article_Style**: A configuration containing writing samples, topics, and delivery preferences stored in the database
- **Style_Sample**: A text sample (article) provided by the user to train the AI on their writing style
- **Topic**: A subject the user wants to write about, which becomes one article
- **Draft_Session**: Temporary storage for user progress through the onboarding flow before account creation
- **Job_Field**: A user profile field capturing the user's occupation/role
- **Google_Sheet**: External spreadsheet where user data is synchronized for article delivery workflow
- **Pending_Style_Data**: Temporary database table storing style data until payment is completed
- **Payment_Success_Flow**: The process that executes after Stripe payment completes successfully

## Requirements

### Requirement 1

**User Story:** As a visitor, I want to start the onboarding process from the landing page, so that I can begin defining my writing style without creating an account first.

#### Acceptance Criteria

1. WHEN a visitor clicks the "Get Started" button on the landing page THEN the Onboarding_Flow SHALL navigate to step 1 of the article style wizard
2. WHEN a visitor accesses step 1 without authentication THEN the Onboarding_Flow SHALL allow the visitor to proceed without requiring login
3. WHEN a visitor begins the onboarding process THEN the Onboarding_Flow SHALL create a Draft_Session to store progress temporarily

### Requirement 2

**User Story:** As a visitor, I want to provide up to 3 article samples in step 1, so that the AI can learn my unique writing style.

#### Acceptance Criteria

1. WHEN a visitor is on step 1 THEN the Onboarding_Flow SHALL display 3 text input areas for Style_Sample entries
2. WHEN a visitor enters text in a Style_Sample field THEN the Onboarding_Flow SHALL validate that the content has a minimum of 100 characters
3. WHEN a visitor attempts to proceed with fewer than 1 Style_Sample THEN the Onboarding_Flow SHALL prevent navigation and display a validation error
4. WHEN a visitor completes step 1 with valid Style_Sample entries THEN the Onboarding_Flow SHALL save the data to the Draft_Session and enable navigation to step 2

### Requirement 3

**User Story:** As a visitor, I want to select topics for my articles in step 2, so that I can specify what subjects I want to write about.

#### Acceptance Criteria

1. WHEN a visitor navigates to step 2 THEN the Onboarding_Flow SHALL display a topic selection interface
2. WHEN a visitor adds a Topic THEN the Onboarding_Flow SHALL validate that the topic text is between 3 and 200 characters
3. WHEN a visitor attempts to proceed with zero topics THEN the Onboarding_Flow SHALL prevent navigation and display a validation error
4. WHEN a visitor completes step 2 with valid Topic entries THEN the Onboarding_Flow SHALL save the data to the Draft_Session and enable navigation to step 3

### Requirement 4

**User Story:** As a visitor, I want to create my account in step 3 without email verification, so that I can proceed to payment immediately.

#### Acceptance Criteria

1. WHEN a visitor navigates to step 3 THEN the Onboarding_Flow SHALL display a signup form with fields for name, email, password, confirm password, and job
2. WHEN a visitor enters data in the signup form THEN the Onboarding_Flow SHALL validate each field according to the following rules: name minimum 2 characters, email valid format, password minimum 8 characters, passwords match, job minimum 2 characters
3. WHEN a visitor submits valid signup data THEN the Onboarding_Flow SHALL create the user account with email_confirm set to true to skip email verification
4. WHEN the user account is created successfully THEN the Onboarding_Flow SHALL save the user profile record to the database immediately
5. WHEN the user profile is saved THEN the Onboarding_Flow SHALL store the style data in the Pending_Style_Data table
6. WHEN all data is saved successfully THEN the Onboarding_Flow SHALL redirect the user to the pricing page for plan selection

### Requirement 5

**User Story:** As a visitor, I want my progress to be preserved if I navigate between steps, so that I don't lose my work.

#### Acceptance Criteria

1. WHEN a visitor navigates back to a previous step THEN the Onboarding_Flow SHALL display the previously entered data
2. WHEN a visitor refreshes the page during the onboarding process THEN the Onboarding_Flow SHALL restore the Draft_Session data from browser storage
3. WHEN a visitor abandons the flow and returns later in the same browser session THEN the Onboarding_Flow SHALL offer to resume from the last completed step

### Requirement 6

**User Story:** As a user who completed signup, I want to select a plan and complete payment on the pricing page, so that I can activate my article style.

#### Acceptance Criteria

1. WHEN a user with pending style data visits the pricing page THEN the system SHALL display available subscription plans
2. WHEN a user selects a plan and clicks checkout THEN the system SHALL create a Stripe checkout session with the user_id and pending_style flag in metadata
3. WHEN the Stripe checkout is created THEN the system SHALL redirect the user to the Stripe-hosted payment page
4. WHEN payment is cancelled or fails THEN the system SHALL redirect the user back to the pricing page with an appropriate message

### Requirement 7

**User Story:** As a user who completed payment, I want my style data to be saved to the database and Google Sheets, so that my article generation can begin.

#### Acceptance Criteria

1. WHEN Stripe payment is completed successfully THEN the Payment_Success_Flow SHALL create an Article_Style record in the database from the Pending_Style_Data
2. WHEN the Article_Style is created THEN the Payment_Success_Flow SHALL synchronize the user data including the Job_Field to the Google_Sheet
3. WHEN both database and Google_Sheet operations succeed THEN the Payment_Success_Flow SHALL delete the Pending_Style_Data record
4. WHEN the Payment_Success_Flow completes successfully THEN the system SHALL redirect the user to the dashboard with a success message

### Requirement 8

**User Story:** As a user, I want to see clear error messages if something goes wrong during signup or payment, so that I can understand and fix the issue.

#### Acceptance Criteria

1. WHEN an error occurs during account creation THEN the Onboarding_Flow SHALL display a specific error message describing the issue
2. WHEN an error occurs during style data saving THEN the Onboarding_Flow SHALL display an error message and allow the user to retry the operation
3. WHEN an error occurs during payment processing THEN the system SHALL display an error message and provide a clear path to retry
4. WHEN an error occurs during Google_Sheet synchronization THEN the system SHALL log the error but not block the user flow, and retry synchronization in the background
5. WHEN a database error occurs after payment THEN the system SHALL display an error message with instructions to contact support and preserve the payment record for manual recovery

### Requirement 9

**User Story:** As a system administrator, I want the Job field to be stored and synced to Google Sheets, so that we have complete user profile data for article generation.

#### Acceptance Criteria

1. WHEN a user completes signup with a Job_Field value THEN the Onboarding_Flow SHALL store the job in the user profile database
2. WHEN user data is synchronized to Google_Sheet THEN the Onboarding_Flow SHALL include the Job_Field in the row data
3. WHEN the Google_Sheet row is created THEN the Onboarding_Flow SHALL place the Job_Field value in the designated column

### Requirement 10

**User Story:** As a visitor, I want clear visual feedback on my progress through the onboarding steps, so that I know how much is left to complete.

#### Acceptance Criteria

1. WHEN a visitor is on any step of the Onboarding_Flow THEN the system SHALL display a progress indicator showing current step and total steps
2. WHEN a visitor completes a step THEN the system SHALL update the progress indicator to show the step as completed
3. WHEN a visitor is on step 3 THEN the system SHALL display messaging indicating this is the final step before account creation and payment
