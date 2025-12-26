# Implementation Plan

- [x] 1. Create LinkedIn login button component
  - [x] 1.1 Create LinkedInLoginButton component with LinkedIn branding
    - Create `components/linkedin-login-button.tsx`
    - Use LinkedIn Blue (#0A66C2) for button background
    - Add LinkedIn icon (use lucide-react Linkedin icon or custom SVG)
    - Implement loading state with spinner
    - Call `supabase.auth.signInWithOAuth({ provider: 'linkedin_oidc' })` on click
    - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4_

  - [ ]\* 1.2 Write property test for OAuth provider parameter
    - **Property 1: OAuth Provider Parameter**
    - **Validates: Requirements 1.1**
  - [ ]\* 1.3 Write property test for loading state behavior
    - **Property 2: Loading State Disables Interaction**
    - **Validates: Requirements 3.4**

- [x] 2. Integrate LinkedIn button into login page
  - [x] 2.1 Add LinkedIn login button to login page
    - Import LinkedInLoginButton component
    - Add visual separator ("or continue with") between form and social login
    - Position LinkedIn button below the separator
    - Ensure consistent spacing and styling with existing form
    - _Requirements: 1.1, 3.1, 3.2, 3.3_
  - [ ]\* 2.2 Write unit tests for login page integration
    - Test LinkedIn button renders on login page
    - Test separator text is displayed
    - _Requirements: 1.1_

- [ ] 3. Create LinkedIn onboarding data utilities
  - [ ] 3.1 Create LinkedIn onboarding storage utilities
    - Create `lib/linkedin-onboarding.ts`
    - Implement `storeLinkedInOnboardingData()` function to save email, name, timestamp to localStorage
    - Implement `getLinkedInOnboardingData()` function to retrieve data with 24-hour expiration check
    - Implement `clearLinkedInOnboardingData()` function to remove data after signup
    - _Requirements: 6.7_
  - [ ]\* 3.2 Write property test for LinkedIn data persistence
    - **Property 10: LinkedIn Data Persistence During Onboarding**
    - **Validates: Requirements 6.7**

- [ ] 4. Update auth callback for existing/new user routing
  - [ ] 4.1 Enhance callback handler with email existence check
    - Query user_profiles table to check if LinkedIn email exists
    - For existing users: proceed with current subscription-based redirect logic
    - For new users: store LinkedIn data and redirect to `/articles/styles?linkedin_onboarding=true`
    - _Requirements: 5.1, 5.3, 6.1_
  - [ ]\* 4.2 Write property test for existing user email matching
    - **Property 6: Existing User Email Matching**
    - **Validates: Requirements 5.1, 5.3**
  - [ ]\* 4.3 Write property test for new user redirect to onboarding
    - **Property 7: New User Redirect to Onboarding**
    - **Validates: Requirements 6.1**
  - [ ]\* 4.4 Write property tests for subscription-based redirects
    - **Property 3: Subscription-Based Redirect for Active Users**
    - **Property 4: Subscription-Based Redirect for Inactive Users**
    - **Validates: Requirements 4.1, 4.2, 5.4**

- [ ] 5. Checkpoint - Verify callback routing works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Update Step 3 form for LinkedIn autofill
  - [ ] 6.1 Add LinkedIn data autofill to step 3 form
    - Check for LinkedIn onboarding data on component mount
    - Autofill email field with LinkedIn email
    - Autofill name field with LinkedIn display name
    - Make email field read-only when LinkedIn data present
    - Hide password and confirm password fields for LinkedIn signups
    - _Requirements: 6.2, 6.3, 6.6_
  - [ ]\* 6.2 Write property test for LinkedIn data autofill
    - **Property 8: LinkedIn Data Autofill**
    - **Validates: Requirements 6.2, 6.3**
  - [ ]\* 6.3 Write property test for email field read-only
    - **Property 9: Email Field Read-Only for LinkedIn Signup**
    - **Validates: Requirements 6.6**

- [ ] 7. Update signup API for LinkedIn users
  - [ ] 7.1 Modify signup-with-style API for LinkedIn flow
    - Accept `isLinkedInSignup` flag in request body
    - Skip password validation when `isLinkedInSignup` is true
    - For LinkedIn users: link existing Supabase auth user to new profile (user already authenticated)
    - Clear LinkedIn onboarding data after successful profile creation
    - _Requirements: 6.4, 6.5_
  - [ ]\* 7.2 Write property test for form submission redirect
    - **Property 11: Form Submission Redirect for LinkedIn Users**
    - **Validates: Requirements 6.4**

- [ ] 8. Checkpoint - Verify full LinkedIn signup flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create setup documentation
  - [x] 9.1 Create SETUP.md with LinkedIn Developer Portal instructions
    - Document steps to create LinkedIn application
    - Document OAuth 2.0 configuration settings
    - Document authorized redirect URI setup
    - _Requirements: 2.1, 2.2_

  - [x] 9.2 Add Supabase configuration instructions to SETUP.md
    - Document enabling LinkedIn OIDC provider in Supabase dashboard
    - Document adding Client ID and Client Secret
    - Document redirect URI verification
    - _Requirements: 2.2, 2.3_

  - [x] 9.3 Add troubleshooting guide to SETUP.md
    - Document common OAuth errors and solutions
    - Document redirect URI mismatch fixes
    - Document scope and permission issues
    - _Requirements: 2.4_

- [ ]\* 10. Write property test for authenticated user redirect
  - **Property 5: Authenticated User Redirect**
  - **Validates: Requirements 4.3**

- [ ] 11. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.
