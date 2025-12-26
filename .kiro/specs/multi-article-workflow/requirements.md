# Requirements Document

## Introduction

This document defines the requirements for transforming the existing onboarding flow into a multi-article styles workflow. The current onboarding steps (step-1, step-2, step-3) will be repurposed as article generation configuration steps accessible via `/articles/generate/step-*` routes. Users will be able to create, update, and delete multiple article styles, with each style stored in both PostgreSQL and Google Sheets for data synchronization. The dashboard will be updated to remove "Your Writing Style" and "Topics Queue" cards, replacing them with a "Recent Article Styles" section and a dedicated "My Articles" section for managing generated articles.

## Glossary

- **Article_Style**: A configuration object containing style samples, subjects, delivery preferences, and language settings that define how articles are generated for a user
- **Style_Sample**: A text sample (article/content) provided by the user to train the AI on their writing voice
- **Subject**: A topic or theme that the user wants to generate articles about
- **Delivery_Days**: The days of the week when articles should be delivered to the user
- **Article_Styles_System**: The system responsible for managing article style CRUD operations and synchronization
- **Excel_Sync**: The process of maintaining data consistency between PostgreSQL and Google Sheets

## Requirements

### Requirement 1

**User Story:** As a user, I want to create multiple article styles, so that I can generate different types of articles with varying writing voices and topics.

#### Acceptance Criteria

1. WHEN a user navigates to `/articles/generate/step-1` THEN the Article_Styles_System SHALL display a form to input up to 3 style samples with word count validation
2. WHEN a user completes step-1 and navigates to step-2 THEN the Article_Styles_System SHALL display a form to add multiple subjects with AI suggestions
3. WHEN a user completes step-2 and navigates to step-3 THEN the Article_Styles_System SHALL display delivery settings including email, name, frequency, and language
4. WHEN a user completes all three steps THEN the Article_Styles_System SHALL create a new Article_Style record in the database with a unique identifier
5. WHEN a new Article_Style is created THEN the Article_Styles_System SHALL synchronize the data to Google Sheets within the same transaction

### Requirement 2

**User Story:** As a user, I want to view all my article styles in a dedicated section, so that I can easily manage and select styles for article generation.

#### Acceptance Criteria

1. WHEN a user visits the dashboard THEN the Article_Styles_System SHALL display a "Recent Article Styles" section showing the most recent styles with proper UI styling
2. WHEN displaying article styles THEN the Article_Styles_System SHALL show style name, language, delivery days count, and creation date for each style
3. WHEN a user has no article styles THEN the Article_Styles_System SHALL display an empty state with a call-to-action to create a new style
4. WHEN a user clicks on an article style THEN the Article_Styles_System SHALL navigate to the style detail view

### Requirement 3

**User Story:** As a user, I want to update my existing article styles, so that I can modify my writing preferences and topics over time.

#### Acceptance Criteria

1. WHEN a user selects an article style for editing THEN the Article_Styles_System SHALL pre-populate all form fields with existing data
2. WHEN a user modifies style samples in step-1 THEN the Article_Styles_System SHALL validate and save the updated samples
3. WHEN a user modifies subjects in step-2 THEN the Article_Styles_System SHALL validate and save the updated subjects
4. WHEN a user modifies delivery settings in step-3 THEN the Article_Styles_System SHALL validate and save the updated settings
5. WHEN an Article_Style is updated THEN the Article_Styles_System SHALL synchronize the changes to Google Sheets
6. WHEN an Article_Style is updated THEN the Article_Styles_System SHALL update the `updated_at` timestamp

### Requirement 4

**User Story:** As a user, I want to delete article styles I no longer need, so that I can keep my workspace organized.

#### Acceptance Criteria

1. WHEN a user initiates deletion of an article style THEN the Article_Styles_System SHALL display a confirmation dialog
2. WHEN a user confirms deletion THEN the Article_Styles_System SHALL remove the Article_Style from PostgreSQL
3. WHEN an Article_Style is deleted from PostgreSQL THEN the Article_Styles_System SHALL remove the corresponding data from Google Sheets
4. WHEN deletion is complete THEN the Article_Styles_System SHALL update the UI to reflect the removal without page reload
5. IF deletion from Google Sheets fails THEN the Article_Styles_System SHALL log the error and notify the user while maintaining PostgreSQL consistency

### Requirement 5

**User Story:** As a user, I want a dedicated "My Articles" section, so that I can view and manage all articles generated from my styles.

#### Acceptance Criteria

1. WHEN a user visits the dashboard THEN the Article_Styles_System SHALL display a "My Articles" section showing all generated articles
2. WHEN displaying articles THEN the Article_Styles_System SHALL show article subject, status, generation date, and associated style name
3. WHEN a user has no articles THEN the Article_Styles_System SHALL display an empty state with guidance on generating articles
4. WHEN a user clicks on an article THEN the Article_Styles_System SHALL navigate to the article detail view

### Requirement 6

**User Story:** As a user, I want the old onboarding flow removed, so that the application has a clean architecture focused on article generation.

#### Acceptance Criteria

1. WHEN the migration is complete THEN the Article_Styles_System SHALL have removed all `/onboarding/*` routes
2. WHEN the migration is complete THEN the Article_Styles_System SHALL have removed all onboarding-related API endpoints
3. WHEN the migration is complete THEN the Article_Styles_System SHALL have removed the "Your Writing Style" card from the dashboard
4. WHEN the migration is complete THEN the Article_Styles_System SHALL have removed the "Topics Queue" card from the dashboard
5. WHEN the migration is complete THEN the Article_Styles_System SHALL preserve existing onboarding data by migrating it to the new article_styles table

### Requirement 7

**User Story:** As a developer, I want the codebase to follow clean architecture principles, so that components are small, reusable, and maintainable.

#### Acceptance Criteria

1. WHEN creating UI components THEN the Article_Styles_System SHALL ensure no single component file exceeds 200 lines of code
2. WHEN creating shared functionality THEN the Article_Styles_System SHALL extract reusable logic into separate utility files
3. WHEN creating form components THEN the Article_Styles_System SHALL use composition with smaller sub-components
4. WHEN creating API routes THEN the Article_Styles_System SHALL follow RESTful conventions with proper error handling
5. WHEN creating database operations THEN the Article_Styles_System SHALL use the existing Supabase client from `/lib/supabase-client.ts`
