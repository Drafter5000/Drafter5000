# Requirements Document

## Introduction

This feature enables users to switch between two distinct UI design systems: a modern design and a Windows 95 retro design. The toggle functionality allows users to experience the application in either aesthetic while maintaining identical functionality and user flows. This supports end-to-end testing of both design systems and provides users with a choice of visual experience.

## Glossary

- **Design Mode**: The active visual theme of the application, either "modern" or "win95"
- **Design Toggle**: A UI control that allows users to switch between design modes
- **Design Provider**: A React context provider that manages the current design mode state
- **Win95 Components**: UI components styled to emulate the Windows 95 operating system aesthetic
- **Modern Components**: UI components using contemporary design patterns with shadcn/ui styling
- **Style Form**: The multi-step form flow for creating article writing styles (Step 1: Articles, Step 2: Topics, Step 3: Settings)

## Requirements

### Requirement 1

**User Story:** As a user, I want to toggle between modern and Win95 design modes, so that I can choose my preferred visual experience.

#### Acceptance Criteria

1. WHEN a user clicks the design toggle button THEN the System SHALL switch the design mode from the current mode to the alternate mode
2. WHEN the design mode changes THEN the System SHALL persist the selected mode to local storage
3. WHEN a user returns to the application THEN the System SHALL restore the previously selected design mode from local storage
4. WHEN the design toggle is rendered THEN the System SHALL display the current design mode indicator

### Requirement 2

**User Story:** As a user, I want the article style creation flow to work identically in both design modes, so that I can complete the same tasks regardless of visual theme.

#### Acceptance Criteria

1. WHEN a user is in Step 1 of style creation in either design mode THEN the System SHALL accept article text input and validate that at least one article is provided
2. WHEN a user is in Step 2 of style creation in either design mode THEN the System SHALL allow adding, removing, and AI-generating topic suggestions
3. WHEN a user is in Step 3 of style creation in either design mode THEN the System SHALL collect style name, email, display name, delivery days, and language preferences
4. WHEN a user completes the style creation flow in either design mode THEN the System SHALL create the article style with identical data structure

### Requirement 3

**User Story:** As a user, I want the dashboard to display correctly in both design modes, so that I can view my metrics and styles in my preferred theme.

#### Acceptance Criteria

1. WHEN a user views the dashboard in modern mode THEN the System SHALL display metrics using modern Card components with trend indicators
2. WHEN a user views the dashboard in Win95 mode THEN the System SHALL display metrics using Win95Window components with retro styling
3. WHEN a user views their article styles in either mode THEN the System SHALL display the same style data with mode-appropriate styling

### Requirement 4

**User Story:** As a user, I want the billing and settings pages to function in both design modes, so that I can manage my account regardless of theme.

#### Acceptance Criteria

1. WHEN a user views the billing page in either design mode THEN the System SHALL display subscription status and plan information
2. WHEN a user views the settings page in either design mode THEN the System SHALL display and allow editing of profile settings
3. WHEN a user navigates between pages THEN the System SHALL maintain the selected design mode

### Requirement 5

**User Story:** As a developer, I want the design toggle to support E2E testing, so that I can verify both design systems function correctly.

#### Acceptance Criteria

1. WHEN the design mode is set THEN the System SHALL add a corresponding CSS class to the document root element
2. WHEN components render THEN the System SHALL use the design mode context to determine which component variant to display
3. WHEN the design provider initializes THEN the System SHALL prevent flash of incorrect design by deferring render until mode is determined
