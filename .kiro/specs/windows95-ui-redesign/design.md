# Design Document: Windows 95 UI Redesign

## Overview

This design document outlines the technical approach for transforming the Drafter application's UI to match the classic Windows 95 aesthetic. The redesign will create a cohesive retro experience while preserving all existing functionality.

The implementation will use a CSS-first approach with custom Win95-themed components that wrap or replace existing shadcn/ui components. This ensures visual consistency while maintaining the existing component API and behavior.

### Reference Design

- URL: https://alexbsoft.github.io/win95.css/personal_page.html
- Key visual elements: Gray backgrounds, beveled 3D borders, blue title bars, system fonts, classic button states

## Architecture

The Windows 95 UI redesign follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Page Components                          │
│  (login, signup, dashboard, article-styles, generate)       │
├─────────────────────────────────────────────────────────────┤
│                  Win95 UI Components                        │
│  (Win95Window, Win95Button, Win95Input, Win95Tabs, etc.)   │
├─────────────────────────────────────────────────────────────┤
│                   Win95 CSS Variables                       │
│  (colors, borders, shadows, fonts)                          │
├─────────────────────────────────────────────────────────────┤
│                   Global Styles                             │
│  (globals.css with Win95 theme)                             │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **CSS Variables First**: Define all Win95 colors, borders, and effects as CSS variables for consistency
2. **Component Composition**: Create Win95 wrapper components that enhance existing functionality
3. **Progressive Enhancement**: Apply Win95 styling without breaking existing component behavior
4. **Minimal JavaScript Changes**: Focus on CSS/styling changes, preserve all business logic

## Components and Interfaces

### Win95 CSS Variables (globals.css)

```css
:root {
  /* Win95 Color Palette */
  --win95-bg: #c0c0c0;
  --win95-bg-dark: #808080;
  --win95-bg-light: #dfdfdf;
  --win95-white: #ffffff;
  --win95-black: #000000;
  --win95-title-bar: #000080;
  --win95-title-bar-inactive: #808080;
  --win95-title-text: #ffffff;
  --win95-button-face: #c0c0c0;
  --win95-button-highlight: #ffffff;
  --win95-button-shadow: #808080;
  --win95-button-dark-shadow: #000000;
  --win95-field-bg: #ffffff;
  --win95-field-border: #808080;
  --win95-selection: #000080;
  --win95-selection-text: #ffffff;

  /* Win95 Typography */
  --win95-font: 'Tahoma', 'Segoe UI', 'Arial', sans-serif;
  --win95-font-size: 11px;
  --win95-font-size-title: 11px;

  /* Win95 Borders */
  --win95-border-raised:
    inset -1px -1px var(--win95-button-dark-shadow), inset 1px 1px var(--win95-button-highlight),
    inset -2px -2px var(--win95-button-shadow), inset 2px 2px var(--win95-bg-light);
  --win95-border-sunken:
    inset -1px -1px var(--win95-button-highlight), inset 1px 1px var(--win95-button-shadow),
    inset -2px -2px var(--win95-bg-light), inset 2px 2px var(--win95-button-dark-shadow);
  --win95-border-field:
    inset -1px -1px var(--win95-button-highlight), inset 1px 1px var(--win95-button-shadow);
}
```

### Win95Window Component

```typescript
interface Win95WindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  showControls?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}
```

The Win95Window component provides the classic window chrome with:

- Title bar with blue background and white text
- Window control buttons (minimize, maximize, close)
- Beveled outer border (raised effect)
- Content area with proper padding

### Win95Button Component

```typescript
interface Win95ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

Button states:

- Default: Raised 3D border effect
- Hover: Same as default (Win95 buttons don't change on hover)
- Active/Pressed: Sunken 3D border, content offset by 1px
- Disabled: Grayed text, flat appearance

### Win95Input Component

```typescript
interface Win95InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```

Input styling:

- White background
- Sunken 3D border (field style)
- Dotted focus indicator
- System font

### Win95Textarea Component

```typescript
interface Win95TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
```

### Win95Select Component

```typescript
interface Win95SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}
```

### Win95Checkbox Component

```typescript
interface Win95CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}
```

### Win95Tabs Component

```typescript
interface Win95TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: { value: string; label: string; icon?: React.ReactNode }[];
  children: React.ReactNode;
}
```

Tab styling:

- Raised tab buttons with beveled edges
- Active tab appears connected to content area
- Inactive tabs appear slightly recessed

### Win95Progress Component

```typescript
interface Win95ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
}
```

### Win95Badge Component

```typescript
interface Win95BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
}
```

### Win95Alert Component

```typescript
interface Win95AlertProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
}
```

## Data Models

No changes to existing data models. The redesign is purely visual and does not affect:

- ArticleStyle type
- User authentication data
- Dashboard metrics
- Form submission payloads

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Based on the prework analysis, the following correctness properties ensure the UI redesign preserves existing functionality:

### Property 1: Form Submission Preservation

_For any_ valid form data submitted through the article generation wizard, the form submission SHALL execute the same API calls with identical payloads as before the UI redesign.
**Validates: Requirements 9.1**

### Property 2: Navigation State Preservation

_For any_ navigation action in the application, the routing behavior and URL state SHALL remain identical to the pre-redesign implementation.
**Validates: Requirements 9.2**

### Property 3: Authentication Flow Preservation

_For any_ authentication action (login, signup, logout), the auth flow SHALL execute the same logic and redirects as before the UI redesign.
**Validates: Requirements 9.3**

### Property 4: Data Display Consistency

_For any_ data fetched from the API, the displayed information content SHALL be identical to the pre-redesign implementation (only visual presentation changes).
**Validates: Requirements 9.4**

### Property 5: Error Handling Preservation

_For any_ error condition, the error handling logic SHALL execute identically and display the same error messages (with Win95 styling).
**Validates: Requirements 9.5**

## Error Handling

Error handling remains unchanged from the existing implementation. The Win95 styling will be applied to:

1. **Form Validation Errors**: Displayed inline below fields with Win95 alert styling
2. **API Errors**: Displayed in Win95-styled alert boxes with appropriate icons
3. **Authentication Errors**: Shown in Win95 dialog-style error messages
4. **Network Errors**: Displayed with Win95 warning icon and message

Error display format:

```
┌─────────────────────────────────────┐
│ ⚠ Error                        [X] │
├─────────────────────────────────────┤
│                                     │
│  [!] Error message text here        │
│                                     │
│              [  OK  ]               │
│                                     │
└─────────────────────────────────────┘
```

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for component behavior and visual regression tests for styling consistency.

#### Unit Tests

Unit tests will verify:

1. Win95 components render correctly with required props
2. Button states (default, pressed, disabled) apply correct CSS classes
3. Form components maintain existing validation behavior
4. Window components render title bar and controls correctly

#### Property-Based Tests

Property-based testing will use **Vitest** with **fast-check** library to verify functional preservation:

1. **Form Submission Property Test**: Generate random valid form data and verify API calls match expected payloads
2. **Navigation Property Test**: Generate random navigation sequences and verify routing behavior
3. **Data Display Property Test**: Generate random API responses and verify displayed content matches

Each property-based test will:

- Run a minimum of 100 iterations
- Be tagged with the corresponding correctness property reference
- Use smart generators that constrain to valid input spaces

#### Visual Testing

Visual regression tests (optional, manual verification acceptable):

1. Screenshot comparison for key pages
2. Component storybook for Win95 components
3. Cross-browser verification for border rendering

### Test File Structure

```
lib/
  win95-components.test.ts    # Unit tests for Win95 components
  win95-form-submission.test.ts  # Property test for form submission
  win95-navigation.test.ts    # Property test for navigation
  win95-data-display.test.ts  # Property test for data display
```

## Implementation Notes

### CSS Class Naming Convention

Win95-specific classes will use the `win95-` prefix:

- `win95-window` - Window container
- `win95-title-bar` - Title bar
- `win95-button` - Button styling
- `win95-input` - Input field styling
- `win95-raised` - Raised border effect
- `win95-sunken` - Sunken border effect

### Component File Structure

```
components/
  win95/
    win95-window.tsx
    win95-button.tsx
    win95-input.tsx
    win95-textarea.tsx
    win95-select.tsx
    win95-checkbox.tsx
    win95-tabs.tsx
    win95-progress.tsx
    win95-badge.tsx
    win95-alert.tsx
    index.ts
```

### Migration Strategy

1. Create Win95 CSS variables in globals.css
2. Build Win95 component library
3. Update page components to use Win95 components
4. Apply Win95 background and font to body
5. Test each page for visual consistency and functional preservation

### Browser Compatibility

The Win95 styling uses standard CSS features supported in all modern browsers:

- CSS custom properties (variables)
- Box-shadow for border effects
- Flexbox for layouts
- CSS Grid for responsive layouts

No polyfills required for target browsers (Chrome, Firefox, Safari, Edge).
