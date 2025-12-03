# Requirements Document

## Introduction

This feature implements a 3-step onboarding flow that collects user preferences and directly appends the collected data as a row in Google Sheets. The onboarding process guides users through defining their writing style, selecting article topics, and configuring delivery settings. Upon completion, all onboarding data is consolidated and appended to a Google Sheets spreadsheet for external processing and tracking.

## Glossary

- **Onboarding_System**: The 3-step wizard interface that collects user preferences during initial setup
- **Style_Sample**: A text article provided by the user to define their writing style
- **Subject**: A topic or theme the user wants articles generated about
- **Delivery_Settings**: User preferences including email, name, language, and delivery schedule
- **Google_Sheets_Client**: The authenticated client that communicates with Google Sheets API
- **Spreadsheet_Row**: A single row of data appended to the Google Sheets document containing all onboarding information

## Requirements

### Requirement 1

**User Story:** As a new user, I want to provide sample articles that represent my writing style, so that the system can learn my unique voice.

#### Acceptance Criteria

1. WHEN a user navigates to step 1 of onboarding THEN the Onboarding_System SHALL display three text input areas for style samples
2. WHEN a user enters text into a style sample field THEN the Onboarding_System SHALL display a word count for that field
3. WHEN a user has entered at least one non-empty style sample THEN the Onboarding_System SHALL enable the continue button
4. WHEN a user submits step 1 with valid style samples THEN the Onboarding_System SHALL persist the style samples to the database
5. IF a user attempts to continue without any style samples THEN the Onboarding_System SHALL prevent navigation and maintain the current state

### Requirement 2

**User Story:** As a new user, I want to select topics for my articles, so that I receive content relevant to my interests.

#### Acceptance Criteria

1. WHEN a user navigates to step 2 of onboarding THEN the Onboarding_System SHALL display a subject input field and a list of added subjects
2. WHEN a user enters a subject and presses Enter or clicks add THEN the Onboarding_System SHALL add the subject to the list if it is non-empty and not a duplicate
3. WHEN a user clicks the AI helper activation button THEN the Onboarding_System SHALL display a list of suggested subjects
4. WHEN a user selects an AI suggestion THEN the Onboarding_System SHALL add that suggestion to the subject list and remove it from suggestions
5. WHEN a user has at least one subject in the list THEN the Onboarding_System SHALL enable the continue button
6. IF a user attempts to add an empty or whitespace-only subject THEN the Onboarding_System SHALL reject the addition and maintain the current list

### Requirement 3

**User Story:** As a new user, I want to configure my delivery preferences, so that I receive articles at the right time and in my preferred language.

#### Acceptance Criteria

1. WHEN a user navigates to step 3 of onboarding THEN the Onboarding_System SHALL display fields for email, first name, last name, delivery days, and language selection
2. WHEN a user selects delivery days THEN the Onboarding_System SHALL allow selection of individual days or an "every day" option
3. WHEN a user selects the "every day" checkbox THEN the Onboarding_System SHALL select all seven days
4. WHEN a user has provided email, first name, last name, and at least one delivery day THEN the Onboarding_System SHALL enable the complete button
5. IF a user attempts to complete setup without all required fields THEN the Onboarding_System SHALL prevent completion and maintain the current state

### Requirement 4

**User Story:** As a system administrator, I want onboarding data appended to Google Sheets, so that I can track and process user information externally.

#### Acceptance Criteria

1. WHEN a user completes the onboarding flow THEN the Onboarding_System SHALL authenticate with Google Sheets API using service account credentials
2. WHEN authentication succeeds THEN the Onboarding_System SHALL append a single row containing all onboarding data to the configured spreadsheet
3. WHEN appending the row THEN the Onboarding_System SHALL include: email, display name, created timestamp, preferred language, delivery days, status, style samples summary, and subjects list
4. IF Google Sheets API returns an error THEN the Onboarding_System SHALL log the error and return a failure response to the client
5. WHEN the row is successfully appended THEN the Onboarding_System SHALL return a success response and redirect the user to the dashboard

### Requirement 5

**User Story:** As a developer, I want to serialize onboarding data to a row format, so that it can be appended to Google Sheets correctly.

#### Acceptance Criteria

1. WHEN serializing onboarding data THEN the Onboarding_System SHALL convert the data object to an array of cell values in a defined column order
2. WHEN serializing array fields (delivery_days, subjects, style_samples) THEN the Onboarding_System SHALL join array elements with a comma separator
3. WHEN deserializing a row from Google Sheets THEN the Onboarding_System SHALL parse the row back into a structured data object
4. WHEN round-tripping data through serialize then deserialize THEN the Onboarding_System SHALL produce an equivalent data object to the original input

### Requirement 6

**User Story:** As a user, I want clear navigation between onboarding steps, so that I can move forward and backward through the process.

#### Acceptance Criteria

1. WHEN a user is on step 2 or step 3 THEN the Onboarding_System SHALL display a back button to return to the previous step
2. WHEN a user clicks the back button THEN the Onboarding_System SHALL navigate to the previous step without losing entered data
3. WHEN a user completes a step THEN the Onboarding_System SHALL navigate to the next step automatically
4. WHILE the Onboarding_System is saving data THEN the Onboarding_System SHALL display a loading indicator and disable form submission
