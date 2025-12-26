# Implementation Plan

## Phase 1: Role System Foundation

- [x] 1. Create role configuration module
  - [x] 1.1 Add UserRoleType enum and RoleConfig interface to lib/types.ts
    - Add `UserRoleType` enum with CUSTOMER, CUSTOMER_ADMIN, and SUPER_ADMIN values
    - Add `RoleConfig` interface with value, label, description, dbOrgRole, isSuperAdmin, canAccessBackoffice, and backofficeScope fields
    - _Requirements: 3.1_

  - [x] 1.2 Create lib/role-config.ts with role configurations and mapping functions
    - Create `ROLE_CONFIGS` constant with Customer, Customer Admin, and Super Admin configurations
    - Implement `getRoleOptions()` function to return array of role configs
    - Implement `mapToUserRole(orgRole, isSuperAdmin)` function for DB to enum conversion
    - Implement `mapToDbFields(role)` function for enum to DB conversion
    - Implement `getRoleLabel(role)` function for display labels
    - Implement `canAccessBackoffice(role)` function
    - Implement `getBackofficeScope(role)` function
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]\* 1.3 Write property tests for role mapping functions
    - **Property 3: Display label mapping consistency**
    - **Property 4: Role mapping round-trip consistency**
    - **Property 5: Backward compatible role mapping**
    - **Validates: Requirements 3.2, 3.3, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4**

- [x] 2. Update user creation flows
  - [x] 2.1 Update UserForm component to use new three-role enum
    - Import role configuration from lib/role-config.ts
    - Replace hardcoded role options with `getRoleOptions()` call
    - Update role state to use `UserRoleType` enum
    - Display role labels from configuration (Customer, Customer Admin, Super Admin)
    - _Requirements: 2.1, 2.5_

  - [x] 2.2 Update admin users API to use role mapper
    - Import mapping functions from lib/role-config.ts
    - Use `mapToDbFields()` to convert selected role to database fields
    - Update createUser call to use mapped org_role and is_super_admin values
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 2.3 Update signup API to explicitly set Customer role
    - Import role configuration from lib/role-config.ts
    - Use `mapToDbFields(UserRoleType.CUSTOMER)` for database field values
    - Ensure is_super_admin is explicitly set to false
    - Ensure organization_members role is set to 'member'
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]\* 2.4 Write property tests for user creation role mapping
    - **Property 1: Signup creates customer with correct database state**

    - **Property 2: User creation role mapping consistency**
    - **Validates: Requirements 1.1, 1.2, 1.3, 2.2, 2.3, 2.4**

- [x] 3. Update user list display
  - [x] 3.1 Update admin-users service to use role mapper for display
    - Import `mapToUserRole` from lib/role-config.ts
    - Update `listUsers` function to map org_role and is_super_admin to UserRoleType
    - Update `getUserById` function to include mapped role
    - Add `userRoleType` field to AdminUserView interface
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 3.2 Update user table component to display mapped role labels
    - Import `getRoleLabel` from lib/role-config.ts
    - Update role column to display label (Customer, Customer Admin, Super Admin)
    - _Requirements: 4.1_

- [x] 4. Checkpoint - Ensure role system tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Organization Scoping

- [x] 5. Create organization scope service
  - [x] 5.1 Create lib/services/org-scope.ts with scoping utilities
    - Create `OrgScopeContext` interface
    - Implement `createOrgScopeContext(session)` to build context from session
    - Implement `applyOrgScope(query, context)` to add org filter to queries

    - Implement `canAccessOrg(context, targetOrgId)` for access checks
    - Implement `getAccessibleOrgIds(context)` to list accessible orgs
    - _Requirements: 6.2, 6.3, 6.4, 7.1, 7.2_

  - [-]\* 5.2 Write property tests for organization scoping
    - **Property 6: Customer Admin organization scoping**
    - **Property 7: Super Admin cross-organization access**
    - **Validates: Requirements 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4**

- [x] 6. Update admin APIs with organization scoping
  - [x] 6.1 Update admin users API to apply organization scope
    - Import org-scope service
    - Create scope context from session
    - Apply scope to user list queries for Customer Admins
    - Allow Super Admins to filter by any organization
    - _Requirements: 6.2, 7.2_
  - [x] 6.2 Update admin organizations API with scope checks
    - Customer Admins: return only their organization
    - Super Admins: return all organizations
    - Add access check before returning org details
    - _Requirements: 6.3, 7.1, 7.3_

- [x] 7. Checkpoint - Ensure organization scoping tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Organization Switcher

- [x] 8. Implement organization switcher
  - [x] 8.1 Create components/org-switcher.tsx component
    - Create dropdown component showing current organization
    - List all organizations user belongs to
    - Handle organization selection
    - Hide switcher when user has only one organization
    - _Requirements: 8.1, 8.4_
  - [x] 8.2 Create API endpoint for switching organizations
    - Create POST /api/user/switch-org endpoint
    - Validate user is member of target organization
    - Update current_organization_id in user_profiles
    - Return updated session data
    - _Requirements: 8.2_
  - [x] 8.3 Update session handling for organization context
    - Add current organization to session data
    - Update role context when organization changes
    - Refresh page data after organization switch
    - _Requirements: 8.3_

  - [ ]\* 8.4 Write property tests for organization switching
    - **Property 8: Organization switching updates context**
    - **Validates: Requirements 8.2, 8.3**

## Phase 4: Admin Backoffice

- [x] 9. Create admin backoffice layout and navigation
  - [x] 9.1 Create app/admin/layout.tsx with role-based navigation
    - Add navigation sidebar component
    - Define navigation items for Customer Admin (Users, Billing, Usage)
    - Define navigation items for Super Admin (Organizations, All Users, Platform Billing, Platform Usage)
    - Filter navigation based on user role
    - _Requirements: 10.1, 10.2_

  - [x] 9.2 Create admin access middleware
    - Check if user can access backoffice using `canAccessBackoffice()`
    - Redirect Customers to customer dashboard
    - Allow Customer Admins and Super Admins to proceed
    - _Requirements: 10.3_

  - [ ]\* 9.3 Write property tests for role-based navigation
    - **Property 10: Role-based navigation visibility**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 10. Create organizations view (Super Admin only)
  - [x] 10.1 Create app/admin/organizations/page.tsx
    - Display list of all organizations in table format
    - Show org name, slug, member count, status, created date
    - Add search and filter functionality
    - Link to organization detail view
    - _Requirements: 7.1_

  - [x] 10.2 Create app/admin/organizations/[id]/page.tsx
    - Display organization details
    - Show member list for selected organization
    - Show billing and usage summary
    - _Requirements: 7.3_

- [x] 11. Create users view with organization scoping
  - [x] 11.1 Update app/admin/users/page.tsx for scoped access
    - Customer Admin: show only organization members
    - Super Admin: show all users with organization filter dropdown

    - Display user role using mapped labels
    - _Requirements: 6.2, 7.2_

  - [x] 11.2 Update user creation form for scoped access
    - Customer Admin: hide organization selector, use current org
    - Super Admin: show organization selector with all orgs
    - _Requirements: 7.4_

- [x] 12. Checkpoint - Ensure backoffice navigation tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Billing and Usage Views

- [x] 13. Create billing status view
  - [x] 13.1 Create lib/services/billing.ts service
    - Implement `getBillingStatus(orgId)` function
    - Implement `getPlatformBillingOverview()` for Super Admin
    - Return subscription status, plan, billing cycle, next billing date
    - _Requirements: 9.1_

  - [x] 13.2 Create app/admin/billing/page.tsx
    - Customer Admin: display own organization billing
    - Super Admin: display platform billing overview or selected org
    - Show subscription status, plan name, billing cycle
    - Show next billing date and amount
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ]\* 13.3 Write property tests for billing data scoping
    - **Property 9: Billing and usage data scoping** (billing portion)
    - **Validates: Requirements 9.1, 9.3, 9.4**

- [x] 14. Create usage metrics view
  - [x] 14.1 Create lib/services/usage.ts service
    - Implement `getUsageMetrics(orgId)` function
    - Implement `getPlatformUsageMetrics()` for Super Admin
    - Return article count, storage usage, API calls
    - _Requirements: 9.2_
  - [x] 14.2 Create app/admin/usage/page.tsx
    - Customer Admin: display own organization usage
    - Super Admin: display platform usage or selected org
    - Show article count, storage bytes, API calls this month
    - Add visual charts for usage trends
    - _Requirements: 9.2, 9.3, 9.4_

  - [ ]\* 14.3 Write property tests for usage data scoping
    - **Property 9: Billing and usage data scoping** (usage portion)
    - **Validates: Requirements 9.2, 9.3, 9.4**

- [x] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
