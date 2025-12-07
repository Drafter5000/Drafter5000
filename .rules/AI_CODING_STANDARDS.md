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

**Task:** [Task description]
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed
**Approach:** [Brief description of the approach]

### Subtasks

<!-- AI: Add subtasks here with checkboxes -->

- [ ] Subtask 1
- [ ] Subtask 2

### Completed Tasks

<!-- AI: Move completed tasks here with brief notes -->

---

## 📚 APPROACH & FLOW DOCUMENTATION

Use this section to document the approach taken for complex tasks.

### [Date] - [Task Name]

**Problem:** [What needed to be solved]

**Solution:** [How it was solved]

**Files Modified:**

- `path/to/file.ts` - [What was changed]

**Notes:** [Any important notes for future reference]

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
