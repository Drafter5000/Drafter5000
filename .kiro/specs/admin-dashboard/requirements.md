# Requirements Document

## Introduction

This document specifies the requirements for an Admin Dashboard feature that enables system administrators to manage users, organizations, and view system-wide metrics. The admin dashboard provides a separate login flow and protected interface for users with administrative privileges (`super_admin` or `admin` roles) to perform user management operations, create new admins, and monitor system health through a clean, intuitive interface.

## Glossary

- **Admin_Dashboard**: The administrative interface accessible only to users with admin privileges
- **Super_Admin**: A user with the highest privilege level who can manage all organizations and users system-wide
- **Admin**: A user with administrative privileges within a specific organization
- **User**: A regular system user without administrative privileges
- **Organization**: A tenant entity that groups users together
- **Role**: The permission level assigned to a user (super_admin, admin, member, viewer)

## Requirements

### Requirement 1

**User Story:** As a super admin, I want to log in through a dedicated admin login page, so that I can access the admin dashboard securely.

#### Acceptance Criteria

1. WHEN a user navigates to the admin login page THEN the Admin_Dashboard SHALL display a login form with email and password fields
2. WHEN a user submits valid admin credentials THEN the Admin_Dashboard SHALL authenticate the user and verify admin privileges before granting access
3. WHEN a non-admin user attempts to log in through the admin login THEN the Admin_Dashboard SHALL reject the login attempt and display an appropriate error message
4. WHEN an admin user successfully authenticates THEN the Admin_Dashboard SHALL redirect the user to the admin dashboard overview page
5. IF authentication fails due to invalid credentials THEN the Admin_Dashboard SHALL display a clear error message without revealing whether the email exists

### Requirement 2

**User Story:** As a super admin, I want to view a dashboard overview with key system metrics, so that I can monitor the health and usage of the platform.

#### Acceptance Criteria

1. WHEN an admin accesses the dashboard overview THEN the Admin_Dashboard SHALL display the total count of registered users
2. WHEN an admin accesses the dashboard overview THEN the Admin_Dashboard SHALL display the total count of organizations
3. WHEN an admin accesses the dashboard overview THEN the Admin_Dashboard SHALL display the count of active subscriptions by plan type
4. WHEN an admin accesses the dashboard overview THEN the Admin_Dashboard SHALL display recent user registrations from the past 7 days
5. WHEN metrics data is loading THEN the Admin_Dashboard SHALL display loading indicators for each metric card

### Requirement 3

**User Story:** As a super admin, I want to view and manage all users in the system, so that I can perform administrative actions on user accounts.

#### Acceptance Criteria

1. WHEN an admin navigates to the users section THEN the Admin_Dashboard SHALL display a paginated list of all users with their email, name, role, and status
2. WHEN an admin searches for a user THEN the Admin_Dashboard SHALL filter the user list based on email or display name
3. WHEN an admin views a user's details THEN the Admin_Dashboard SHALL display the user's profile information, organization membership, and subscription status
4. WHEN an admin updates a user's role THEN the Admin_Dashboard SHALL persist the role change to the database and reflect the update immediately
5. WHEN an admin deactivates a user account THEN the Admin_Dashboard SHALL mark the user as inactive and prevent future logins

### Requirement 4

**User Story:** As a super admin, I want to create new admin users, so that I can delegate administrative responsibilities.

#### Acceptance Criteria

1. WHEN an admin initiates user creation THEN the Admin_Dashboard SHALL display a form with fields for email, display name, and role selection
2. WHEN an admin submits valid user creation data THEN the Admin_Dashboard SHALL create the user account in Supabase auth and user_profiles table
3. WHEN an admin assigns the admin role during creation THEN the Admin_Dashboard SHALL set the appropriate role in the organization_members table
4. IF the email already exists in the system THEN the Admin_Dashboard SHALL display an error message indicating the duplicate email
5. WHEN a new admin user is created THEN the Admin_Dashboard SHALL send an invitation email with password setup instructions

### Requirement 5

**User Story:** As a super admin, I want to manage organizations, so that I can oversee all tenants in the system.

#### Acceptance Criteria

1. WHEN an admin navigates to the organizations section THEN the Admin_Dashboard SHALL display a list of all organizations with their name, member count, and status
2. WHEN an admin views an organization's details THEN the Admin_Dashboard SHALL display the organization's members and their roles
3. WHEN an admin creates a new organization THEN the Admin_Dashboard SHALL create the organization record and allow assignment of an initial admin
4. WHEN an admin updates organization settings THEN the Admin_Dashboard SHALL persist the changes and reflect updates immediately
5. WHEN an admin deactivates an organization THEN the Admin_Dashboard SHALL mark the organization as inactive and prevent member access

### Requirement 6

**User Story:** As an admin, I want the admin dashboard to be protected from unauthorized access, so that sensitive data remains secure.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access any admin route THEN the Admin_Dashboard SHALL redirect to the admin login page
2. WHEN a user without admin privileges attempts to access admin routes THEN the Admin_Dashboard SHALL display an access denied message and redirect to the regular dashboard
3. WHILE a user session is active THEN the Admin_Dashboard SHALL validate admin privileges on each protected route access
4. WHEN an admin session expires THEN the Admin_Dashboard SHALL redirect to the admin login page with a session expired message
5. WHEN admin actions are performed THEN the Admin_Dashboard SHALL log the action with timestamp and admin user ID for audit purposes
