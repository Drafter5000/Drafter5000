# Implementation Plan

- [x] 1. Set up Win95 CSS foundation
  - [x] 1.1 Add Win95 CSS variables to globals.css
    - Define color palette variables (--win95-bg, --win95-title-bar, etc.)
    - Define border effect variables (--win95-border-raised, --win95-border-sunken)
    - Define typography variables (--win95-font, --win95-font-size)
    - Apply Win95 background color to body
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create Win95 base utility classes
    - Create .win95-raised class for raised border effect
    - Create .win95-sunken class for sunken border effect
    - Create .win95-field class for input field borders
    - _Requirements: 1.3, 1.5, 1.6_

- [x] 2. Create Win95 core components
  - [x] 2.1 Create Win95Window component
    - Implement window container with beveled border
    - Implement title bar with blue background and white text
    - Implement window control buttons (minimize, maximize, close)
    - Export from components/win95/index.ts
    - _Requirements: 1.3, 1.4_

  - [ ]\* 2.2 Write property test for Win95Window rendering
    - **Property 4: Data Display Consistency**
    - **Validates: Requirements 9.4**

  - [x] 2.3 Create Win95Button component
    - Implement raised 3D border for default state
    - Implement sunken 3D border for pressed/active state
    - Implement disabled state with grayed text
    - Support size variants (sm, md, lg)
    - _Requirements: 1.5, 1.6, 7.1, 7.2, 7.3_

  - [x] 2.4 Create Win95Input component
    - Implement white background with sunken border
    - Implement dotted focus indicator
    - Support label and error message display
    - _Requirements: 6.1, 7.4_

  - [x] 2.5 Create Win95Textarea component
    - Implement white background with sunken border
    - Support label and error message display
    - _Requirements: 6.2_

  - [x] 2.6 Create Win95Select component
    - Implement sunken border with dropdown arrow
    - Style dropdown options with Win95 theme
    - _Requirements: 6.3_

  - [x] 2.7 Create Win95Checkbox component
    - Implement sunken square with checkmark indicator
    - Support label display
    - _Requirements: 6.4_

  - [x] 2.8 Create Win95Tabs component
    - Implement tab buttons with beveled edges
    - Style active tab as connected to content
    - Style inactive tabs as slightly recessed
    - _Requirements: 2.3, 5.4_

  - [x] 2.9 Create Win95Progress component
    - Implement Win95 style progress bar
    - Support value and max props
    - _Requirements: 7.5_

  - [x] 2.10 Create Win95Badge component
    - Implement small beveled labels
    - Support variant styles
    - _Requirements: 5.5_

  - [x] 2.11 Create Win95Alert component
    - Implement Win95 style alert box
    - Support info, warning, error, success types
    - Include appropriate icons
    - _Requirements: 3.5_

  - [ ]\* 2.12 Write unit tests for Win95 components
    - Test Win95Button states (default, pressed, disabled)
    - Test Win95Input focus and error states
    - Test Win95Tabs active/inactive states
    - _Requirements: 1.5, 1.6, 7.1, 7.2, 7.3, 7.4_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update Login and Signup pages
  - [x] 4.1 Update Login page with Win95 styling
    - Wrap form in Win95Window component
    - Replace inputs with Win95Input components
    - Replace button with Win95Button component
    - Apply Win95 background to page
    - Remove floating 3D shapes and modern styling
    - _Requirements: 3.1, 3.3, 3.4_

  - [ ]\* 4.2 Write property test for login form submission
    - **Property 1: Form Submission Preservation**
    - **Validates: Requirements 9.1**

  - [x] 4.3 Update Signup page with Win95 styling
    - Wrap form in Win95Window component
    - Replace inputs with Win95Input components
    - Replace button with Win95Button component
    - Update email verification screen with Win95 dialog styling
    - _Requirements: 3.2, 3.3, 3.4, 3.6_

  - [ ]\* 4.4 Write property test for signup form submission
    - **Property 1: Form Submission Preservation**
    - **Validates: Requirements 9.1**

  - [ ]\* 4.5 Write property test for authentication flow
    - **Property 3: Authentication Flow Preservation**
    - **Validates: Requirements 9.3**

- [x] 5. Update Article Generation Wizard
  - [x] 5.1 Update wizard layout with Win95 styling
    - Wrap wizard in Win95Window with "Create Article Style" title
    - Update progress indicator with Win95 step styling
    - Update header with Win95 toolbar styling
    - _Requirements: 2.1, 2.2_

  - [x] 5.2 Update Step 1 (Writing Style) page
    - Replace tabs with Win95Tabs component
    - Replace textarea with Win95Textarea component
    - Replace buttons with Win95Button components
    - Update progress card with Win95 panel styling
    - _Requirements: 2.3, 2.6, 2.7_

  - [x] 5.3 Update StyleFormStep1 component
    - Apply Win95 styling to article input tabs
    - Apply Win95 styling to progress indicators
    - Apply Win95 styling to navigation buttons
    - _Requirements: 2.3, 2.6, 2.7_

  - [x] 5.4 Update Step 2 (Topics) page
    - Apply Win95 panel styling to topic cards
    - Replace input with Win95Input component
    - Replace buttons with Win95Button components
    - _Requirements: 2.4, 2.6, 2.7_

  - [x] 5.5 Update StyleFormStep2 component
    - Apply Win95 sunken panel styling to topic list
    - Apply Win95 styling to AI suggestions card
    - Apply Win95 styling to navigation buttons
    - _Requirements: 2.4, 2.6, 2.7_

  - [x] 5.6 Update Step 3 (Sign Up) page
    - Apply Win95 grouped panel styling to form cards
    - Replace all inputs with Win95Input components
    - Replace checkboxes with Win95Checkbox components
    - Replace select with Win95Select component
    - _Requirements: 2.5, 2.6, 2.7_

  - [x] 5.7 Update StyleFormStep3Signup component
    - Apply Win95 panel styling to account, password, delivery, language cards
    - Apply Win95 styling to day selection checkboxes
    - Apply Win95 styling to submit button
    - _Requirements: 2.5, 2.6, 2.7_

  - [ ]\* 5.8 Write property test for wizard form submission
    - **Property 1: Form Submission Preservation**
    - **Validates: Requirements 9.1**

  - [ ]\* 5.9 Write property test for wizard navigation
    - **Property 2: Navigation State Preservation**
    - **Validates: Requirements 9.2**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update Dashboard
  - [x] 7.1 Update DashboardHeader with Win95 styling
    - Apply Win95 toolbar styling to header
    - Replace buttons with Win95Button components
    - Apply Win95 styling to navigation links
    - _Requirements: 4.5_

  - [x] 7.2 Update Dashboard page with Win95 styling
    - Wrap dashboard in Win95Window with "Dashboard" title
    - Apply Win95 grouped panel styling to metric cards
    - Apply Win95 styling to welcome section
    - Apply Win95 styling to payment success banner
    - _Requirements: 4.1, 4.2_

  - [x] 7.3 Update MetricCard component with Win95 styling
    - Apply Win95 beveled border to card
    - Apply Win95 styling to icon container
    - Apply Win95 styling to trend indicators
    - _Requirements: 4.2_

  - [x] 7.4 Update StyleCard component with Win95 styling
    - Apply Win95 list item styling
    - Replace badges with Win95Badge components
    - Replace buttons with Win95Button components
    - _Requirements: 4.3, 4.4_

  - [ ]\* 7.5 Write property test for dashboard data display
    - **Property 4: Data Display Consistency**
    - **Validates: Requirements 9.4**

- [x] 8. Update Article Styles pages
  - [x] 8.1 Update Article Styles list page
    - Wrap page in Win95Window component
    - Apply Win95 styling to empty state
    - Apply Win95 styling to style card
    - _Requirements: 5.1, 5.2_

  - [x] 8.2 Update Article Style detail page
    - Wrap page in Win95Window component
    - Apply Win95 grouped panel styling to info cards
    - Apply Win95Badge styling to badges
    - Replace buttons with Win95Button components
    - _Requirements: 5.3, 5.5_

  - [x] 8.3 Update Article Style edit page
    - Wrap page in Win95Window component
    - Replace tabs with Win95Tabs component
    - Apply Win95 styling to form components
    - _Requirements: 5.4_

  - [x] 8.4 Update StyleFormStep3 component (edit mode)
    - Apply Win95 panel styling to settings cards
    - Apply Win95 styling to day selection
    - Apply Win95 styling to language selector
    - _Requirements: 5.4, 6.3, 6.4_

- [x] 9. Update responsive behavior
  - [x] 9.1 Add responsive styles for Win95 components
    - Add media queries for desktop (centered windows, max-width)
    - Add media queries for tablet (adjusted margins)
    - Add media queries for mobile (full-width windows)
    - Update grid layouts to stack on smaller screens
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 10. Final testing and cleanup
  - [ ]\* 10.1 Write property test for error handling
    - **Property 5: Error Handling Preservation**
    - **Validates: Requirements 9.5**

  - [ ]\* 10.2 Run all property-based tests
    - Execute all property tests with 100+ iterations
    - Verify all functional preservation properties pass
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 10.3 Visual verification
    - Verify all pages match Win95 aesthetic
    - Verify responsive behavior on different screen sizes
    - Verify all interactive states work correctly
    - _Requirements: 1.1-1.6, 7.1-7.5, 8.1-8.4_

- [x] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
