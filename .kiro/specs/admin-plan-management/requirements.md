# Requirements Document

## Introduction

This feature provides a comprehensive admin interface for managing subscription plans in the Drafter application. Administrators can enable/disable plans, modify all plan properties (name, price, features, visibility, etc.), and manage plan features through a user-friendly UI. Additionally, a default admin user (admin@drafter.com) is embedded for the organization with the ability to reset the password.

## Glossary

- **Subscription Plan**: A pricing tier that defines the features and limits available to users (e.g., Free, Pro, Enterprise)
- **Plan Feature**: A text description of a capability included in a subscription plan
- **Admin User**: A user with super_admin privileges who can manage plans and system settings
- **Default Admin**: The pre-seeded admin user (admin@drafter.com) that comes with the system
- **Plan Visibility**: Whether a plan is shown on the public pricing page
- **Plan Active Status**: Whether a plan can be subscribed to by users

## Requirements

### Requirement 1

**User Story:** As an admin, I want to view all subscription plans in a list, so that I can see the current state of all plans at a glance.

#### Acceptance Criteria

1. WHEN an admin navigates to the plans management page THEN the System SHALL display a list of all subscription plans with their key properties (name, price, status, visibility)
2. WHEN plans are displayed THEN the System SHALL show each plan's active/inactive status with a visual indicator
3. WHEN plans are displayed THEN the System SHALL show each plan's visibility status (visible/hidden on pricing page)
4. WHEN plans are loaded THEN the System SHALL order plans by their sort_order field

### Requirement 2

**User Story:** As an admin, I want to edit any plan's properties, so that I can adjust pricing and features as business needs change.

#### Acceptance Criteria

1. WHEN an admin clicks edit on a plan THEN the System SHALL display a form with all editable plan properties
2. WHEN an admin submits valid plan changes THEN the System SHALL update the plan in the database and display a success message
3. WHEN an admin modifies the price THEN the System SHALL allow optional sync to Stripe
4. WHEN an admin submits invalid data THEN the System SHALL display validation errors without saving changes

### Requirement 3

**User Story:** As an admin, I want to enable or disable plans, so that I can control which plans are available for subscription.

#### Acceptance Criteria

1. WHEN an admin toggles a plan's active status THEN the System SHALL update the is_active field in the database
2. WHEN a plan is deactivated THEN the System SHALL prevent new subscriptions to that plan
3. WHEN a plan's active status changes THEN the System SHALL display the updated status immediately

### Requirement 4

**User Story:** As an admin, I want to control plan visibility, so that I can hide plans from the public pricing page while keeping them active for existing subscribers.

#### Acceptance Criteria

1. WHEN an admin toggles a plan's visibility THEN the System SHALL update the is_visible field in the database
2. WHEN a plan is hidden THEN the System SHALL exclude it from the public pricing page
3. WHEN a plan is hidden but active THEN the System SHALL allow existing subscribers to continue using the plan

### Requirement 5

**User Story:** As an admin, I want to manage plan features, so that I can update the feature list displayed to users.

#### Acceptance Criteria

1. WHEN an admin views a plan THEN the System SHALL display all features associated with that plan
2. WHEN an admin adds a feature THEN the System SHALL create a new plan_feature record with the specified text and sort order
3. WHEN an admin removes a feature THEN the System SHALL delete the plan_feature record from the database
4. WHEN an admin reorders features THEN the System SHALL update the sort_order of affected features

### Requirement 6

**User Story:** As a system administrator, I want a default admin user embedded in the system, so that I can access the admin panel immediately after deployment.

#### Acceptance Criteria

1. WHEN the system is initialized THEN the System SHALL create a default admin user with email admin@drafter.com
2. WHEN the default admin is created THEN the System SHALL set the password to Admin@123
3. WHEN the default admin is created THEN the System SHALL set is_super_admin to true
4. WHEN the default admin logs in THEN the System SHALL grant full admin panel access

### Requirement 7

**User Story:** As an admin, I want to reset the default admin password, so that I can secure the account after initial setup.

#### Acceptance Criteria

1. WHEN an admin accesses the settings page THEN the System SHALL display an option to reset the admin password
2. WHEN an admin submits a new password THEN the System SHALL validate the password meets security requirements (minimum 8 characters, at least one uppercase, one lowercase, one number, one special character)
3. WHEN a valid new password is submitted THEN the System SHALL update the admin user's password in the authentication system
4. WHEN the password is successfully changed THEN the System SHALL display a success confirmation

### Requirement 8

**User Story:** As an admin, I want to create new subscription plans, so that I can introduce new pricing tiers.

#### Acceptance Criteria

1. WHEN an admin clicks create new plan THEN the System SHALL display a form with all required plan fields
2. WHEN an admin submits a valid new plan THEN the System SHALL create the plan in the database
3. WHEN creating a paid plan THEN the System SHALL optionally create corresponding Stripe product and price
4. WHEN a plan is created THEN the System SHALL redirect to the plans list with a success message
