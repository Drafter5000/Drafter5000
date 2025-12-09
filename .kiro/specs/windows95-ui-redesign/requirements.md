# Requirements Document

## Introduction

This document defines the requirements for redesigning the Drafter application's user interface to match the classic Windows 95 aesthetic, as demonstrated in the reference URL (https://alexbsoft.github.io/win95.css/personal_page.html). The redesign will apply to the article generation flow (3-step wizard), article styles management, dashboard, login, and signup pages while preserving all existing functionality and business logic.

The Windows 95 design features characteristic elements including: beveled 3D borders, gray color palette (#c0c0c0 background), system fonts (MS Sans Serif style), title bars with minimize/maximize/close buttons, and classic button styling with raised/pressed states.

## Glossary

- **Win95_UI**: The Windows 95 visual design system characterized by beveled borders, gray backgrounds, and classic window chrome
- **Window_Component**: A container element styled as a Windows 95 window with title bar, borders, and content area
- **Title_Bar**: The top section of a Win95 window containing the title text and window control buttons
- **Beveled_Border**: A 3D border effect using light and dark colors to create raised or sunken appearance
- **System_Button**: A button styled with Windows 95 raised/pressed 3D effects
- **Inset_Field**: An input field with sunken 3D border effect typical of Win95 form controls
- **Progress_Indicator**: A visual element showing step completion in the wizard flow
- **Article_Style_Flow**: The 3-step wizard for creating article styles (Writing Style → Topics → Sign Up)
- **Dashboard_View**: The main authenticated user view showing metrics and article style management

## Requirements

### Requirement 1: Windows 95 Base Styling System

**User Story:** As a user, I want the application to have a consistent Windows 95 visual theme, so that I experience a nostalgic retro interface throughout the application.

#### Acceptance Criteria

1. WHEN the application loads THEN the Win95_UI SHALL display a gray (#c0c0c0) background color across all pages
2. WHEN any text is rendered THEN the Win95_UI SHALL use a system font stack that approximates MS Sans Serif (Tahoma, Arial, sans-serif)
3. WHEN a Window_Component is displayed THEN the Win95_UI SHALL render a 2px beveled border with light (#ffffff) top/left and dark (#808080) bottom/right edges
4. WHEN a Title_Bar is rendered THEN the Win95_UI SHALL display a blue (#000080) background with white text and window control buttons
5. WHEN a System_Button is in default state THEN the Win95_UI SHALL display raised 3D borders with light top/left and dark bottom/right edges
6. WHEN a System_Button is pressed THEN the Win95_UI SHALL display inverted (sunken) 3D borders

### Requirement 2: Article Generation Wizard UI

**User Story:** As a user, I want the 3-step article generation wizard to look like Windows 95 dialog windows, so that I can complete the onboarding flow with a retro aesthetic.

#### Acceptance Criteria

1. WHEN the wizard layout is displayed THEN the Article_Style_Flow SHALL render inside a Window_Component with proper Title_Bar showing "Create Article Style"
2. WHEN the progress indicator is shown THEN the Article_Style_Flow SHALL display step numbers in Windows 95 style with beveled step indicators
3. WHEN Step 1 (Writing Style) is active THEN the Win95_UI SHALL display the article input tabs as Windows 95 tab controls with beveled edges
4. WHEN Step 2 (Topics) is active THEN the Win95_UI SHALL display topic cards as sunken panels with beveled borders
5. WHEN Step 3 (Sign Up) is active THEN the Win95_UI SHALL display form cards as grouped Windows 95 panels with proper field styling
6. WHEN form inputs are displayed THEN the Win95_UI SHALL render Inset_Field styling with sunken 3D borders
7. WHEN navigation buttons are displayed THEN the Win95_UI SHALL render System_Button styling for Back/Continue/Submit actions

### Requirement 3: Login and Signup Pages UI

**User Story:** As a user, I want the login and signup pages to look like Windows 95 dialog boxes, so that authentication feels consistent with the retro theme.

#### Acceptance Criteria

1. WHEN the login page loads THEN the Win95_UI SHALL display the login form inside a centered Window_Component
2. WHEN the signup page loads THEN the Win95_UI SHALL display the signup form inside a centered Window_Component
3. WHEN form fields are displayed THEN the Win95_UI SHALL render email and password inputs with Inset_Field styling
4. WHEN the submit button is displayed THEN the Win95_UI SHALL render it as a System_Button with proper hover/active states
5. WHEN validation errors occur THEN the Win95_UI SHALL display error messages in a Windows 95 style alert box with warning icon
6. WHEN the email verification screen is shown THEN the Win95_UI SHALL display it as a Windows 95 information dialog

### Requirement 4: Dashboard UI

**User Story:** As a user, I want the dashboard to look like a Windows 95 application window, so that I can manage my articles in a retro interface.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the Dashboard_View SHALL display inside a Window_Component with Title_Bar showing "Dashboard"
2. WHEN metric cards are displayed THEN the Dashboard_View SHALL render them as Windows 95 grouped panels with beveled borders
3. WHEN the article style card is displayed THEN the Dashboard_View SHALL render it as a Windows 95 list item with proper selection styling
4. WHEN action buttons are displayed THEN the Dashboard_View SHALL render them as System_Button elements
5. WHEN the header navigation is displayed THEN the Dashboard_View SHALL render it as a Windows 95 toolbar with beveled buttons

### Requirement 5: Article Styles Management UI

**User Story:** As a user, I want the article styles pages to maintain Windows 95 styling, so that viewing and editing styles feels consistent with the theme.

#### Acceptance Criteria

1. WHEN the styles list page loads THEN the Win95_UI SHALL display the page inside a Window_Component
2. WHEN a style card is displayed THEN the Win95_UI SHALL render it as a Windows 95 list item with icon and details
3. WHEN the style detail page loads THEN the Win95_UI SHALL display information in grouped Windows 95 panels
4. WHEN the edit style page loads THEN the Win95_UI SHALL display tabs as Windows 95 tab controls
5. WHEN badges are displayed THEN the Win95_UI SHALL render them as small beveled labels with system colors

### Requirement 6: Form Controls and Inputs

**User Story:** As a user, I want all form controls to have Windows 95 styling, so that interactions feel authentic to the retro theme.

#### Acceptance Criteria

1. WHEN a text input is rendered THEN the Win95_UI SHALL display it with white background and sunken 3D border
2. WHEN a textarea is rendered THEN the Win95_UI SHALL display it with white background, sunken border, and optional scrollbar styling
3. WHEN a select/dropdown is rendered THEN the Win95_UI SHALL display it with sunken border and dropdown arrow button
4. WHEN a checkbox is rendered THEN the Win95_UI SHALL display it as a sunken square with checkmark indicator
5. WHEN a radio button is rendered THEN the Win95_UI SHALL display it as a sunken circle with dot indicator
6. WHEN form labels are rendered THEN the Win95_UI SHALL display them in system font with proper spacing

### Requirement 7: Visual Feedback and States

**User Story:** As a user, I want visual feedback on interactive elements to match Windows 95 behavior, so that I understand the state of UI elements.

#### Acceptance Criteria

1. WHEN a button is hovered THEN the Win95_UI SHALL maintain the raised appearance without color change
2. WHEN a button is pressed/active THEN the Win95_UI SHALL display sunken 3D borders and slight content offset
3. WHEN a button is disabled THEN the Win95_UI SHALL display grayed-out text with flat borders
4. WHEN an input is focused THEN the Win95_UI SHALL display a dotted focus indicator inside the field
5. WHEN a loading state is active THEN the Win95_UI SHALL display an hourglass cursor or Windows 95 style progress indicator

### Requirement 8: Responsive Behavior

**User Story:** As a user, I want the Windows 95 UI to work on different screen sizes, so that I can use the application on various devices.

#### Acceptance Criteria

1. WHEN the viewport is desktop-sized THEN the Win95_UI SHALL display windows centered with appropriate max-width
2. WHEN the viewport is tablet-sized THEN the Win95_UI SHALL adjust window width to fit with proper margins
3. WHEN the viewport is mobile-sized THEN the Win95_UI SHALL display windows at full width with minimal margins
4. WHEN grid layouts are used THEN the Win95_UI SHALL stack columns vertically on smaller screens

### Requirement 9: Preserve Existing Functionality

**User Story:** As a developer, I want all existing business logic and functionality to remain unchanged, so that the UI redesign does not break any features.

#### Acceptance Criteria

1. WHEN form submissions occur THEN the Article_Style_Flow SHALL execute the same API calls and validation logic
2. WHEN navigation occurs THEN the Win95_UI SHALL maintain the same routing and state management
3. WHEN authentication flows execute THEN the Win95_UI SHALL preserve all auth logic and redirects
4. WHEN data is displayed THEN the Win95_UI SHALL show the same information with only visual changes
5. WHEN error handling occurs THEN the Win95_UI SHALL display errors using the same logic with Win95 styling
