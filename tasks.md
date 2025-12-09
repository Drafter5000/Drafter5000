# Drafter - Tasks & Requirements

## Status Legend

- [ ] Not started
- [x] Completed
- [~] In progress

---

## Completed Tasks ✅

- [x] Hydration error fix on homepage (Math.random, Date)
- [x] Simplified user flow - removed standalone signup, consolidated into Get Started flow
- [x] Email verification screen stays on screen after signup (not auto-redirect to login)
- [x] Improved "Email not verified" error message on login page

---

## High Priority Tasks

### 1. Google Sheets Integration

- [ ] Add "Job" column to Main Sheet (data from Step 3)
- [ ] Ensure customers only have 1 row in Main Sheet
- [ ] When row is created in Main Sheet, create new page in "Customers" sheet with name = "sheet name" column value
- [ ] Fix: Main Sheet not updating when account created and step 1-2-3 completed
- [ ] Step 2 topics should appear in "Customers" spreadsheet under correct customer page with status "Needs Draft"

### 2. User Flow & Logic

- [ ] Flow: Landing Page → Step 1 → Step 2 → Step 3 (account creation/payment/preferences)
- [ ] First login logic: Check if step 1-2-3 completed → if yes: dashboard, if no: Step 1-2-3
- [ ] Dashboard should be landing page for logged-in users who completed onboarding

### 3. Dashboard Updates

- [ ] Show list of article topics with status icon (needs draft / sent) - from Step 2
- [ ] Show list of articles drafted with status "sent" - from workflow results
- [ ] Add preference modification section (modify Step 1-2-3 settings)

### 4. Step 2 Improvements

- [ ] Add 1 topic example for format guidance (e.g., "Why Follow-Ups Fail When Reps Only 'Check In'—And a Repeatable Formula for Follow-Ups That Actually Move Deals Forward")
- [ ] Update AI prompt logic:
  - Prompt: "You're a LinkedIn topic drafter. Your job is to act as a [job title], look at the topic ideas already drafted here [existing topics] and generate 10 more like it that are different enough to be novel."
  - Should use existing topics as reference, NOT writing style
- [ ] Add ability to modify/customize the AI prompt (for optimization)

### 5. Step 3 Updates

- [ ] Remove "Style name" field (only 1 style per customer for now)
- [ ] "Your information" - option to use signup info instead of re-entering
- [ ] Language options: Only English and French
- [ ] Add "Job Title" field with info bubble ("the AI will draft as if he was doing that job")

### 6. Authentication Improvements

- [ ] Add "Forgot my password" button on login page
- [ ] Research: LinkedIn OAuth login integration (for better UX and data)

---

## Questions to Resolve

1. **LinkedIn Login**: Would require LinkedIn OAuth setup. Benefits:
   - Better UX (one-click login)
   - Access to profile data (job title, company, etc.)
   - Requires LinkedIn Developer App registration
   - Implementation complexity: Medium

---

## Technical Notes

### Google Sheets Structure

- **Main Sheet**: Customer master list (1 row per customer)
  - Columns: name, email, job, sheet_name, etc.
- **Customers Sheet**: Individual pages per customer
  - Page name = sheet_name from Main Sheet
  - Contains topics with status (Needs Draft / Sent)

### AI Topic Generation

- Input variables:
  - `job`: User's job title
  - `existing_topics`: Topics already in the left panel
- Output: 10 new topic ideas different from existing ones
- Should NOT reference writing style samples

---

## File References

- Step 1: `app/articles/generate/step-1/page.tsx`
- Step 2: `app/articles/generate/step-2/page.tsx`
- Step 3: `app/articles/generate/step-3/page.tsx`
- Dashboard: `app/dashboard/page.tsx`
- Login: `app/login/page.tsx`
- Google Sheets API: `app/api/` (to be identified)
