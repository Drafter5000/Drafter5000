# Drafter - AI Coding Standards & Rules

This document defines the standard practices that AI assistants must follow when performing vibe coding on this project.

---

## 🚫 DO NOT RUN

- **DO NOT** run `bun run lint` or any linting commands
- **DO NOT** run `bun run build` or any build commands
- **DO NOT** run `bun test` or any testing commands
- **DO NOT** run `bun run dev` or start the development server
- **DO NOT** create additional markdown files - use only this single file for documentation
- ** DO NOT** use `npm`,`pnpm` or `yarn`. just use the `bun` for the installation and all the packages related tasks performance.

---

## 📋 TASK PLANNING (MANDATORY)

Before starting any task:

1. **Create a proper plan** with clear objectives
2. **Break down into subtasks** with estimated scope
3. **Document the approach** in the TODO section below
4. **Update progress** as you complete each subtask

---

## 🏗️ ARCHITECTURE RULES

### Project Structure

```
/app
  /api          → All API routes (Next.js App Router)
  /[feature]    → Feature-specific pages
/components
  /ui           → Reusable UI components (shadcn/ui)
  /[feature]    → Feature-specific components
/hooks          → Custom React hooks (reusable)
/lib
  /hooks        → Data fetching hooks
  *.ts          → Utility functions, clients, types
/styles         → Global styles
```

### API Routes

- All API routes MUST be created inside `/app/api/` folder
- Follow RESTful conventions
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Always handle errors with appropriate status codes

### Database

- Use single reusable Supabase client instance from `/lib/supabase-client.ts`
- Browser client: `/lib/supabase-browser.ts`
- Never create new database client instances

### Components

- **STRICTLY use shadcn/ui components** from `/components/ui/` for all UI elements
- If a required component doesn't exist in shadcn/ui, create it in `/components/` (common folder)
- Feature-specific components go in `/components/[feature]/`
- Use composition over inheritance
- Keep components small and focused

### Hooks

- Reusable hooks go in `/hooks/` or `/lib/hooks/`
- Data fetching hooks should handle loading, error, and data states
- Use proper TypeScript types

### Utils

- Utility functions go in `/lib/utils.ts` or feature-specific files in `/lib/`
- Keep functions pure when possible
- Add proper TypeScript types

---

## 💻 CODE QUALITY RULES

### TypeScript

- Use strict TypeScript - no `any` unless absolutely necessary
- Define interfaces/types for all data structures
- Export types from `/lib/types.ts`

### Optimization

- Avoid unnecessary re-renders
- Use `useMemo` and `useCallback` appropriately
- Lazy load components when beneficial
- Keep bundle size minimal

### Error Handling

- Always wrap async operations in try-catch
- Provide meaningful error messages
- Log errors with context using `console.error`

#### Backend API Error Handling

- All API routes MUST return JSON responses with proper Content-Type headers
- Always validate environment variables at the start of API routes
- Parse request body in a try-catch to handle malformed JSON
- Return appropriate HTTP status codes:
  - 400: Bad Request (validation errors, missing fields)
  - 401: Unauthorized (authentication failures)
  - 403: Forbidden (authorization failures)
  - 404: Not Found
  - 500: Internal Server Error (unexpected errors)
- Error response format: `{ error: "Human-readable message" }`
- Never expose internal error details to clients in production
- Use typed error handling: `catch (error: unknown)` with instanceof checks

#### Frontend Error Handling

- Use the `apiClient` from `/lib/api-client.ts` for all API calls
- Display user-friendly error messages from API responses
- Handle network errors gracefully with fallback messages
- Show loading states during async operations
- Clear error states when user retries an action

#### Form Validation Rules

- **ALWAYS use field-level validation** for form inputs (inline error messages below each field)
- **DO NOT use toast/alert messages** for form validation errors
- Toast messages should ONLY be used for:
  - Backend API errors (server errors, network failures)
  - Success confirmations after form submission
- Field-level validation pattern:
  - Display error message directly below the invalid field
  - Add `border-destructive` class to highlight invalid fields
  - Clear field error when user starts typing/selecting
  - Use `text-xs text-destructive` for error message styling
- Mark required fields with `<span className="text-destructive">*</span>` after the label

### Naming Conventions

- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Utils: camelCase (`formatDate.ts`)
- API routes: kebab-case folders (`/api/user-profile/`)

---

## 📝 TODO & PROGRESS TRACKING

Use this section to track all tasks. Update as you work.

### Current Task

<!-- AI: Update this section when starting a new task -->

**Task:** None
**Status:** [x] Completed
**Approach:** N/A

### Subtasks

<!-- AI: Add subtasks here with checkboxes -->

N/A

### Completed Tasks

<!-- AI: Move completed tasks here with brief notes -->

- [x] LinkedIn OAuth onboarding flow - Auto-fill user data from LinkedIn, hide password fields, hide "Already have an account?" link
- [x] Payment tracking system - Added payments table and webhook handlers to track all payment transactions
- [x] Usage/Credits tracking system - Added database-based usage tracking to subscriptions table, replacing Google Sheets-based tracking

---

## 📚 APPROACH & FLOW DOCUMENTATION

Use this section to document the approach taken for complex tasks.

### December 15, 2025 - Payment Tracking System

**Problem:** The system had subscription tracking but no dedicated payments table to track individual payment transactions for audit and history purposes.

**Solution:**

1. Created `payments` table to store all payment transactions with details (amount, status, payment method, etc.)
2. Updated Stripe webhook to record payments on `checkout.session.completed`, `invoice.payment_succeeded`, and `invoice.payment_failed` events
3. Created `/api/payments` endpoint to fetch payment history for users
4. Added TypeScript types for Payment and PaymentListResponse

**Files Modified:**

- `scripts/18-payments-table.sql` - New migration for payments table
- `app/api/stripe/webhook/route.ts` - Added payment recording logic
- `app/api/payments/route.ts` - New API endpoint for payment history
- `lib/types.ts` - Added Payment types

**Notes:** The payments table tracks: payment intent ID, invoice ID, charge ID, subscription ID, amount, currency, status, payment method details, failure reasons, and timestamps.

### December 15, 2025 - Usage/Credits Tracking System

**Problem:** Usage tracking was based on counting "Sent" articles from Google Sheets, which was unreliable and didn't integrate well with the subscription billing cycle.

**Solution:**

1. Added usage tracking fields to `subscriptions` table: `articles_used`, `articles_limit`, `usage_reset_at`
2. Updated Stripe webhook to set `articles_limit` from plan when subscription is created/updated
3. Reset usage automatically when subscription renews (new billing period)
4. Updated `lib/usage-limits.ts` to read/write usage from database instead of Google Sheets
5. Created `/api/usage` endpoint for getting and incrementing usage
6. Updated topic status change to "Sent" to increment usage in database

**Files Modified:**

- `scripts/19-subscription-usage-tracking.sql` - New migration for usage tracking fields
- `lib/usage-limits.ts` - Rewrote to use database-based tracking
- `lib/types.ts` - Added SubscriptionUsage, UsageLimitResult, IncrementUsageResult types
- `app/api/usage/route.ts` - New API endpoint for usage operations
- `app/api/stripe/webhook/route.ts` - Added usage limit setting and reset on subscription events
- `app/api/stripe/usage/route.ts` - Updated to use database-based tracking
- `app/api/topics/[rowIndex]/route.ts` - Added usage increment when status changes to "Sent"
- `app/actions/billing.ts` - Updated getUsageStats to use database

**Notes:** Usage is now tracked per billing period in the database. When a subscription renews, usage is automatically reset. The `articles_limit` is set from the plan's `articles_per_month` field.

### December 15, 2025 - LinkedIn OAuth Onboarding Flow

**Problem:** After LinkedIn login, users were redirected to step-3 which asked for email, name, and job even though this data was already available from LinkedIn. The header also showed "Already have an account? Sign in" which was confusing for logged-in users.

**Solution:**

1. Updated auth callback to create user profile for new LinkedIn users and redirect to onboarding step-1
2. Modified step-3 to detect LinkedIn users and pre-fill their data (name, email, job)
3. Hidden password fields for LinkedIn users since they authenticate via OAuth
4. Hidden "Already have an account? Sign in" link for authenticated users
5. Created new API endpoint for LinkedIn users to complete onboarding without password
6. Added validation function for LinkedIn signup (no password required)

**Files Modified:**

- `app/auth/callback/route.ts` - Added LinkedIn user profile creation and onboarding redirect logic
- `app/articles/generate/layout.tsx` - Hide sign-in link for LinkedIn users
- `app/articles/generate/step-1/page.tsx` - Preserve provider parameter in navigation
- `app/articles/generate/step-2/page.tsx` - Preserve provider parameter in navigation
- `app/articles/generate/step-3/page.tsx` - Detect LinkedIn users, pre-fill data, hide password fields
- `lib/onboarding-validation.ts` - Added validateLinkedInSignupForm function
- `app/api/auth/complete-linkedin-onboarding/route.ts` - New API endpoint for LinkedIn onboarding

**Notes:** LinkedIn users are identified by the `provider=linkedin` query parameter or by checking if user is authenticated. The flow preserves this parameter across all steps.

---

## ✅ CHECKLIST BEFORE COMPLETING ANY TASK

- [ ] Code follows the architecture rules above
- [ ] Reusable components/hooks/utils are properly placed
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] No console.log statements (use console.error/warn if needed)
- [ ] TODO section is updated with progress
- [ ] Approach is documented if task was complex

---

## 🔄 SINGLE FILE RULE

**IMPORTANT:** This is the ONLY markdown file that should be created or modified for documentation purposes. Do not create:

- README files for features
- Separate documentation files
- Multiple TODO files
- Changelog files

All documentation, todos, and approach notes go in THIS file only.
