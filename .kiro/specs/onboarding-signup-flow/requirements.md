# Requirements Document

## Introduction

This document defines the requirements for a new streamlined user onboarding flow that combines article style creation with user signup and payment. The flow transforms the current separate processes (landing page → signup → dashboard → article style creation) into a unified 3-step wizard that guides anonymous users from the landing page through article style setup, topic selection, and finally account creation with payment.

The new flow enables users to experience the product value (defining their writing style and topics) before committing to signup and payment, reducing friction and improving conversion rates.

## Glossary

- **Onboarding_Flow**: The 3-step wizard process that guides users from landing page to account creation
- **Article_Style**: A configuration containing writing samples, topics, and delivery preferences
- **Style_Sample**: A text sample (article) provided by the user to train the AI on their writing style
- **Topic**: A subject the user wants to write about, which becomes one article
- **Draft_Session**: Temporary storage for user progress through the onboarding flow before account creation
- **Job_Field**: A new user profile field capturing the user's occupation/role
- **Google_Sheet**: External spreadsheet where user data is synchronized for article delivery workflow

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

**User Story:** As a visitor, I want to create my account and complete payment in step 3, so that I can finalize my setup and start receiving articles.

#### Acceptance Criteria

1. WHEN a visitor navigates to step 3 THEN the Onboarding_Flow SHALL display a signup form with fields for name, email, password, confirm password, and job
2. WHEN a visitor enters data in the signup form THEN the Onboarding_Flow SHALL validate each field according to the following rules: name minimum 2 characters, email valid format, password minimum 8 characters, passwords match, job minimum 2 characters
3. WHEN a visitor submits valid signup data THEN the Onboarding_Flow SHALL create the user account in the authentication system
4. WHEN the user account is created successfully THEN the Onboarding_Flow SHALL redirect to the Stripe checkout for payment
5. WHEN payment is completed successfully THEN the Onboarding_Flow SHALL convert the Draft_Session data into a permanent Article_Style record
6. WHEN the Article_Style is created THEN the Onboarding_Flow SHALL synchronize the user data including the Job_Field to the Google_Sheet

### Requirement 5

**User Story:** As a visitor, I want my progress to be preserved if I navigate between steps, so that I don't lose my work.

#### Acceptance Criteria

1. WHEN a visitor navigates back to a previous step THEN the Onboarding_Flow SHALL display the previously entered data
2. WHEN a visitor refreshes the page during the onboarding process THEN the Onboarding_Flow SHALL restore the Draft_Session data from browser storage
3. WHEN a visitor abandons the flow and returns later in the same browser session THEN the Onboarding_Flow SHALL offer to resume from the last completed step

### Requirement 6

**User Story:** As a system administrator, I want the Job field to be stored and synced to Google Sheets, so that we have complete user profile data for article generation.

#### Acceptance Criteria

1. WHEN a user completes signup with a Job_Field value THEN the Onboarding_Flow SHALL store the job in the user profile database
2. WHEN user data is synchronized to Google_Sheet THEN the Onboarding_Flow SHALL include the Job_Field in the row data
3. WHEN the Google_Sheet row is created THEN the Onboarding_Flow SHALL place the Job_Field value in the designated column

### Requirement 7

**User Story:** As a developer, I want the old authentication-required article generation flow to be removed, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN the new Onboarding_Flow is deployed THEN the system SHALL remove the ProtectedRoute wrapper from the article generation pages
2. WHEN the new Onboarding_Flow is deployed THEN the system SHALL update the step 3 page to include signup and payment functionality
3. WHEN the new Onboarding_Flow is deployed THEN the system SHALL remove redundant code paths that handled authenticated article style creation separately

### Requirement 8

**User Story:** As a visitor, I want clear visual feedback on my progress through the onboarding steps, so that I know how much is left to complete.

#### Acceptance Criteria

1. WHEN a visitor is on any step of the Onboarding_Flow THEN the system SHALL display a progress indicator showing current step and total steps
2. WHEN a visitor completes a step THEN the system SHALL update the progress indicator to show the step as completed
3. WHEN a visitor is on step 3 THEN the system SHALL display messaging indicating this is the final step before account creation
