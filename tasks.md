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
- [x] Add "Forgot my password" button on login page
- [x] Language options: Only English and French (Step 3)
- [x] Add "Job Title" field with info bubble (Step 3)
- [x] Add 1 topic example for format guidance (Step 2)
- [x] Add "Job" column to Main Sheet (data from Step 3)
- [x] When row is created in Main Sheet, create new page in "Customers" sheet
- [x] Step 2 topics appear in "Customers" spreadsheet with status "Needs Draft"
- [x] First login logic: Check if onboarding completed → if yes: dashboard, if no: Step 1
- [x] Added onboarding_completed flag to user profile after payment

---

## High Priority Tasks

### 1. Google Sheets Integration

- [x] Add "Job" column to Main Sheet (data from Step 3)
- [ ] Ensure customers only have 1 row in Main Sheet (need to check for existing row before insert)
- [x] When row is created in Main Sheet, create new page in "Customers" sheet with name = "sheet name" column value
- [~] Fix: Main Sheet not updating when account created and step 1-2-3 completed (sync logic updated, needs testing)
- [x] Step 2 topics should appear in "Customers" spreadsheet under correct customer page with status "Needs Draft"

### 2. User Flow & Logic

- [x] Flow: Landing Page → Step 1 → Step 2 → Step 3 (account creation/payment/preferences)
- [x] First login logic: Check if step 1-2-3 completed → if yes: dashboard, if no: Step 1-2-3
- [x] Dashboard should be landing page for logged-in users who completed onboarding

### 3. Dashboard Updates

- [ ] Show list of article topics with status icon (needs draft / sent) - from Step 2
- [ ] Show list of articles drafted with status "sent" - from workflow results
- [ ] Add preference modification section (modify Step 1-2-3 settings)

### 4. Step 2 Improvements

- [x] Add 1 topic example for format guidance
- [ ] Update AI prompt logic:
  - Prompt: "You're a LinkedIn topic drafter. Your job is to act as a [job title], look at the topic ideas already drafted here [existing topics] and generate 10 more like it that are different enough to be novel."
  - Should use existing topics as reference, NOT writing style
- [ ] Add ability to modify/customize the AI prompt (for optimization)

### 5. Step 3 Updates

- [ ] Remove "Style name" field (only 1 style per customer for now)
- [ ] "Your information" - option to use signup info instead of re-entering
- [x] Language options: Only English and French
- [x] Add "Job Title" field with info bubble ("the AI will draft as if he was doing that job")

### 6. Authentication Improvements

- [x] Add "Forgot my password" button on login page
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
  - Columns: sheet_name, name, email, job, language, email_days (mon-sun), paywall_status, end_of_membership, customer_sheet_created, article_examples (1-3)
- **Customers Sheet**: Individual pages per customer
  - Page name = sheet_name from Main Sheet
  - Columns: Topic, Status, Subject, Article, Last Update, Client
  - Status values: "Needs Draft" / "Sent"

### AI Topic Generation

- Input variables:
  - `job`: User's job title
  - `existing_topics`: Topics already in the left panel
- Output: 10 new topic ideas different from existing ones
- Should NOT reference writing style samples

### Database Schema Updates Needed

- `user_profiles` table needs `onboarding_completed` boolean column

---

## File References

- Step 1: `app/articles/generate/step-1/page.tsx`
- Step 2: `app/articles/generate/step-2/page.tsx`
- Step 3: `app/articles/generate/step-3/page.tsx`
- Dashboard: `app/dashboard/page.tsx`
- Login: `app/login/page.tsx`
- Forgot Password: `app/forgot-password/page.tsx`
- Google Sheets Sync: `lib/services/article-styles-sync.ts`
- Google Sheets API: `lib/google-sheets.ts`
- Stripe Webhook: `app/api/stripe/webhook/route.ts`
- Middleware: `middleware.ts`
