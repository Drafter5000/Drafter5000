# Requirements Document

## Introduction

This feature enables users to sign in to the Drafter application using their LinkedIn accounts via Supabase OAuth integration. LinkedIn login provides a professional authentication option that aligns with the target audience of content creators and business professionals. The implementation leverages Supabase's built-in OAuth support for LinkedIn OIDC provider.

## Glossary

- **Supabase**: The backend-as-a-service platform providing authentication, database, and other services for the application
- **OAuth**: Open Authorization protocol that enables secure delegated access
- **LinkedIn OIDC**: LinkedIn's OpenID Connect implementation for authentication
- **Redirect URI**: The URL where LinkedIn redirects users after authentication
- **Client ID**: The public identifier for the LinkedIn application
- **Client Secret**: The confidential key used to authenticate the LinkedIn application

## Requirements

### Requirement 1

**User Story:** As a user, I want to sign in using my LinkedIn account, so that I can access the application without creating a separate password.

#### Acceptance Criteria

1. WHEN a user clicks the LinkedIn login button on the login page THEN the System SHALL redirect the user to LinkedIn's authorization page
2. WHEN LinkedIn authorization succeeds THEN the System SHALL exchange the authorization code for a session and redirect the user to the appropriate page based on subscription status
3. WHEN LinkedIn authorization fails THEN the System SHALL redirect the user to the login page with an error message
4. WHEN a new user signs in via LinkedIn for the first time THEN the System SHALL create a user profile using LinkedIn profile data

### Requirement 2

**User Story:** As a developer, I want clear setup instructions for LinkedIn OAuth configuration, so that I can properly configure the integration in both LinkedIn Developer Portal and Supabase.

#### Acceptance Criteria

1. WHEN setting up LinkedIn OAuth THEN the Documentation SHALL provide step-by-step instructions for creating a LinkedIn application
2. WHEN configuring Supabase THEN the Documentation SHALL specify the exact redirect URI format required
3. WHEN configuring environment variables THEN the Documentation SHALL list all required credentials and their purposes
4. WHEN troubleshooting common issues THEN the Documentation SHALL provide solutions for typical OAuth configuration errors

### Requirement 3

**User Story:** As a user, I want the LinkedIn login button to be visually consistent with LinkedIn's branding guidelines, so that I can easily recognize and trust the authentication option.

#### Acceptance Criteria

1. WHEN displaying the LinkedIn login button THEN the System SHALL use LinkedIn's official brand colors (LinkedIn Blue #0A66C2)
2. WHEN displaying the LinkedIn login button THEN the System SHALL include the LinkedIn logo icon
3. WHEN the user hovers over the LinkedIn button THEN the System SHALL provide visual feedback consistent with other login options
4. WHEN the LinkedIn login is in progress THEN the System SHALL display a loading state to indicate authentication is processing

### Requirement 4

**User Story:** As a user, I want the LinkedIn login to work seamlessly with the existing authentication flow, so that my experience is consistent regardless of login method.

#### Acceptance Criteria

1. WHEN a LinkedIn user has an active subscription THEN the System SHALL redirect to the dashboard after login
2. WHEN a LinkedIn user has no active subscription THEN the System SHALL redirect to the subscribe page after login
3. WHEN a LinkedIn user is already logged in THEN the System SHALL redirect away from the login page to the dashboard
4. WHEN the LinkedIn OAuth callback is received THEN the System SHALL use the existing auth callback handler to process the session

### Requirement 5

**User Story:** As an existing user, I want to login with LinkedIn using my registered email, so that I can access my account and see my existing data without creating a duplicate account.

#### Acceptance Criteria

1. WHEN a user authenticates via LinkedIn AND the LinkedIn email matches an existing user_profiles email THEN the System SHALL link the LinkedIn identity to the existing account
2. WHEN an existing user logs in via LinkedIn THEN the System SHALL display the user's existing dashboard data including article styles and subscription information
3. WHEN an existing user logs in via LinkedIn THEN the System SHALL preserve all existing user data and preferences
4. WHEN an existing user with active subscription logs in via LinkedIn THEN the System SHALL redirect directly to the dashboard

### Requirement 6

**User Story:** As a new user, I want to sign up using LinkedIn, so that I can quickly create an account with my LinkedIn profile information pre-filled.

#### Acceptance Criteria

1. WHEN a user authenticates via LinkedIn AND the LinkedIn email does not exist in user_profiles THEN the System SHALL redirect to the article style creation flow (step 1)
2. WHEN a new LinkedIn user reaches step 3 of style creation THEN the System SHALL autofill the email field with the LinkedIn email address
3. WHEN a new LinkedIn user reaches step 3 of style creation THEN the System SHALL autofill the name field with the LinkedIn display name
4. WHEN a new LinkedIn user completes the style creation form THEN the System SHALL redirect to the pricing selection page
5. WHEN a new LinkedIn user selects a pricing plan THEN the System SHALL complete the account setup and activate the subscription
6. WHEN autofilling LinkedIn data in step 3 THEN the System SHALL make the email field read-only to prevent modification
7. WHEN a new LinkedIn user is in the onboarding flow THEN the System SHALL store the LinkedIn session data temporarily until account setup is complete
