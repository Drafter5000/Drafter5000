# Requirements Document

## Introduction

This feature introduces a three-role system for the multi-tenant application with role-based access control and organization isolation. The system distinguishes between three user types:

1. **Customer** - End-users who sign up and access their own data
2. **Customer Admin** - Organization administrators who manage their own organization's users, data, and billing
3. **Super Admin** - Platform administrators with full access to all organizations and system-wide management

The system implements multi-tenant architecture where Customer Admins can only view and manage data within their assigned organization, while Super Admins have cross-organization visibility. Users can belong to multiple organizations and switch between them.

## Glossary

- **Customer**: An end-user who signs up to use the platform's services. Customers can view their own data and manage their subscriptions.
- **Customer Admin**: An organization-level administrator who can access the admin backoffice for their organization only. They can view organization users, billing status, and usage data.
- **Super Admin**: A platform administrator with full access to all organizations, users, and system-wide settings.
- **Organization**: A tenant in the multi-tenant system. Each organization has isolated data and users.
- **Role Enum**: A TypeScript enum defining the available user roles (CUSTOMER, CUSTOMER_ADMIN, SUPER_ADMIN).
- **Organization Scope**: The data isolation boundary that restricts Customer Admins to their organization's data.
- **Admin Backoffice**: The administrative dashboard for managing organizations, users, billing, and usage.

## Requirements

### Requirement 1

**User Story:** As a new user, I want to be automatically assigned the Customer role when I sign up, so that I can immediately access customer features without manual role assignment.

#### Acceptance Criteria

1. WHEN a user completes the public signup form THEN the System SHALL create the user profile with the Customer role assigned
2. WHEN a user signs up THEN the System SHALL add the user to the default organization with the member role in organization_members table
3. WHEN a user profile is created via signup THEN the System SHALL set is_super_admin to false

### Requirement 2

**User Story:** As a Super Admin, I want to select a role (Customer, Customer Admin, or Super Admin) when creating a new user, so that I can assign appropriate access levels.

#### Acceptance Criteria

1. WHEN a Super Admin accesses the user creation form THEN the System SHALL display a role selection dropdown with Customer, Customer Admin, and Super Admin options
2. WHEN a Super Admin selects the Customer role THEN the System SHALL create the user with member role in organization_members and is_super_admin set to false
3. WHEN a Super Admin selects the Customer Admin role THEN the System SHALL create the user with admin role in organization_members and is_super_admin set to false
4. WHEN a Super Admin selects the Super Admin role THEN the System SHALL create the user with super_admin role in organization_members and is_super_admin set to true
5. WHEN the role dropdown is rendered THEN the System SHALL load roles from the UserRoleType enum

### Requirement 3

**User Story:** As a developer, I want a centralized role enum definition, so that role values are consistent across the application.

#### Acceptance Criteria

1. WHEN the application loads role options THEN the System SHALL retrieve values from a single UserRoleType enum definition
2. WHEN a role is displayed in the UI THEN the System SHALL use the display label from the role configuration (Customer, Customer Admin, Super Admin)
3. WHEN a role is stored in the database THEN the System SHALL map the enum value to the appropriate database fields (org_role and is_super_admin)

### Requirement 4

**User Story:** As an admin viewing the user list, I want to see each user's role displayed clearly, so that I can understand their access level at a glance.

#### Acceptance Criteria

1. WHEN the admin views the user list THEN the System SHALL display the mapped role (Customer, Customer Admin, or Super Admin) for each user
2. WHEN a user has is_super_admin set to true THEN the System SHALL display their role as Super Admin
3. WHEN a user has admin org_role and is_super_admin is false THEN the System SHALL display their role as Customer Admin
4. WHEN a user has member or viewer org_role and is_super_admin is false THEN the System SHALL display their role as Customer

### Requirement 5

**User Story:** As a system architect, I want the role system to maintain backward compatibility with existing data, so that current users retain their appropriate access levels.

#### Acceptance Criteria

1. WHEN the system reads existing users with super_admin org_role or is_super_admin true THEN the System SHALL map them to the Super Admin display role
2. WHEN the system reads existing users with admin org_role and is_super_admin false THEN the System SHALL map them to the Customer Admin display role
3. WHEN the system reads existing users with member or viewer org_role THEN the System SHALL map them to the Customer display role
4. WHEN the role mapping functions are called THEN the System SHALL handle all existing org_role enum values without errors

### Requirement 6

**User Story:** As a Customer Admin, I want to access an admin backoffice scoped to my organization, so that I can manage my organization's users and view billing information.

#### Acceptance Criteria

1. WHEN a Customer Admin logs in THEN the System SHALL redirect them to the organization-scoped admin backoffice
2. WHEN a Customer Admin views the users list THEN the System SHALL display only users belonging to their organization
3. WHEN a Customer Admin views organization details THEN the System SHALL display only their organization's information
4. WHEN a Customer Admin attempts to access another organization's data THEN the System SHALL deny access and display an unauthorized error

### Requirement 7

**User Story:** As a Super Admin, I want to view and manage all organizations in the admin backoffice, so that I can oversee the entire platform.

#### Acceptance Criteria

1. WHEN a Super Admin accesses the admin backoffice THEN the System SHALL display a list of all organizations
2. WHEN a Super Admin views the users list THEN the System SHALL display users from all organizations with organization filter options
3. WHEN a Super Admin selects an organization THEN the System SHALL display that organization's details, users, billing, and usage
4. WHEN a Super Admin creates a user THEN the System SHALL allow selecting any organization for the user

### Requirement 8

**User Story:** As a user belonging to multiple organizations, I want to switch between organizations, so that I can access data from different organizations I belong to.

#### Acceptance Criteria

1. WHEN a user belongs to multiple organizations THEN the System SHALL display an organization switcher in the navigation
2. WHEN a user selects a different organization THEN the System SHALL update the current_organization_id and refresh the displayed data
3. WHEN a user switches organizations THEN the System SHALL apply the user's role within the selected organization for access control
4. WHEN a user has only one organization THEN the System SHALL hide the organization switcher

### Requirement 9

**User Story:** As an admin, I want to view billing status and usage metrics in the backoffice, so that I can monitor subscription health and resource consumption.

#### Acceptance Criteria

1. WHEN an admin views the billing section THEN the System SHALL display subscription status, plan name, and billing cycle information
2. WHEN an admin views the usage section THEN the System SHALL display article count, storage usage, and API call metrics
3. WHEN a Customer Admin views billing THEN the System SHALL display only their organization's billing information
4. WHEN a Super Admin views billing THEN the System SHALL display billing information for the selected organization or aggregated platform metrics

### Requirement 10

**User Story:** As an admin, I want role-based navigation in the backoffice, so that I only see menu items relevant to my access level.

#### Acceptance Criteria

1. WHEN a Customer Admin accesses the backoffice THEN the System SHALL display navigation items for Users, Billing, and Usage within their organization scope
2. WHEN a Super Admin accesses the backoffice THEN the System SHALL display navigation items for Organizations, All Users, Platform Billing, and Platform Usage
3. WHEN a Customer attempts to access the backoffice THEN the System SHALL deny access and redirect to the customer dashboard
