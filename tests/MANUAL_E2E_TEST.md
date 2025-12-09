# Manual E2E Test Guide - Onboarding Flow

This document provides step-by-step instructions for manually testing the complete onboarding flow with sample data.

## Prerequisites

Before testing, ensure:

- [ ] Development server is running (`npm run dev`)
- [ ] Supabase local instance is running (`npm run db:start`)
- [ ] Stripe test mode is configured
- [ ] Google Sheets API is configured (optional)
- [ ] Environment variables are set in `.env.local`

## Test Data

### Sample Articles (Step 1)

Use these 3 sample articles to test the writing style analysis:

---

#### Article 1: Technology & AI

```
The Rise of AI in Modern Software Development

Artificial intelligence is no longer a futuristic concept—it's reshaping how we build software today. From code completion tools like GitHub Copilot to automated testing frameworks, AI is becoming an indispensable part of the developer's toolkit.

What makes this shift particularly interesting is how it changes the role of developers. Rather than replacing programmers, AI tools are augmenting their capabilities. A developer who once spent hours debugging can now identify issues in minutes. Code reviews that took days can be completed in hours with AI-assisted analysis.

The key to success in this new landscape isn't just adopting AI tools—it's understanding when and how to use them effectively. The best developers are learning to collaborate with AI, treating it as a powerful assistant rather than a replacement for human judgment.

As we move forward, the developers who thrive will be those who embrace this partnership, using AI to handle repetitive tasks while focusing their human creativity on solving complex problems that require nuanced understanding and innovative thinking.
```

**Word Count:** ~180 words

---

#### Article 2: Business & Marketing

```
Why Most Marketing Strategies Fail (And How to Fix Yours)

Every year, companies spend billions on marketing campaigns that never deliver results. The problem isn't usually the budget or the channels—it's the fundamental approach.

Most failed marketing strategies share a common flaw: they focus on what the company wants to say rather than what customers need to hear. This inside-out thinking leads to messaging that sounds impressive in boardrooms but falls flat with actual buyers.

The fix is surprisingly simple: start with customer problems, not product features. Before crafting any campaign, ask yourself: What keeps my target customer awake at night? What would make their job easier? What outcome are they really trying to achieve?

When you lead with empathy and genuine understanding, your marketing transforms from noise into signal. Customers don't just notice your message—they feel understood. And that emotional connection is what drives action.

The best marketers I know spend more time listening than talking. They conduct customer interviews, analyze support tickets, and study competitor reviews. This research isn't glamorous, but it's the foundation of marketing that actually works.
```

**Word Count:** ~190 words

---

#### Article 3: Productivity & Work

```
The Myth of Multitasking: Why Deep Work Wins

We've been sold a lie about productivity. The modern workplace celebrates the ability to juggle multiple tasks, respond instantly to messages, and stay perpetually connected. But research consistently shows this approach destroys our ability to do meaningful work.

When we switch between tasks, our brains pay a "switching cost"—a period of reduced performance as we mentally shift gears. Studies suggest this cost can consume up to 40% of our productive time. That's nearly half your workday lost to context switching.

The alternative is what Cal Newport calls "deep work": extended periods of focused, uninterrupted concentration on cognitively demanding tasks. This is where breakthrough ideas happen, where complex problems get solved, and where real value is created.

Implementing deep work requires intentional boundaries. Block time on your calendar for focused work. Turn off notifications. Let colleagues know when you're unavailable. These practices might feel uncomfortable at first, but the results speak for themselves.

The professionals who master deep work don't just accomplish more—they produce work of significantly higher quality. In a world of constant distraction, the ability to focus deeply is becoming a rare and valuable skill.
```

**Word Count:** ~210 words

---

### Sample Topics (Step 2)

Use these topics to test the topic selection:

1. `How AI is Transforming Customer Service: A Practical Guide for Small Businesses`
2. `The 5 Email Marketing Mistakes That Are Killing Your Conversion Rates`
3. `Remote Work Productivity: Building a Home Office That Actually Works`
4. `Why Your Content Strategy Needs a Complete Overhaul in 2025`
5. `The Psychology of Pricing: How to Set Prices That Customers Love`

---

## Test Scenarios

### Scenario 1: Complete Happy Path

**Objective:** Test the full onboarding flow from start to finish.

#### Step 1: Writing Style

1. Navigate to `http://localhost:3000`
2. Click "Get Started Free" button
3. Verify URL is `/articles/generate/step-1`
4. Verify page shows "Define Your Writing Style" heading
5. Verify 3 text areas are displayed with "Required" badges on all
6. Verify "Continue" button is disabled initially

**Actions:**

- Paste Article 1 into the first textarea
- Verify word count updates (should show ~180 words)
- Verify "Article 1" tab shows checkmark ✓
- Paste Article 2 into the second textarea
- Paste Article 3 into the third textarea
- Verify progress bar shows 3/3 articles
- Verify "Continue" button is now enabled
- Click "Continue"

**Expected Results:**

- [ ] All 3 articles are saved to session storage
- [ ] Navigation to `/articles/generate/step-2`
- [ ] No errors displayed

---

#### Step 2: Topics

1. Verify URL is `/articles/generate/step-2`
2. Verify page shows "Choose Your Topics" heading
3. Verify topic input field is displayed
4. Verify "Continue" button is disabled initially

**Actions:**

- Type first topic from the list above
- Press Enter or click "Add"
- Verify topic appears in the list with badge "1"
- Add remaining 4 topics
- Verify all 5 topics are displayed
- Verify "Continue" button is enabled
- Click "Continue"

**Expected Results:**

- [ ] All topics saved with "Needs Draft" status
- [ ] Navigation to `/articles/generate/step-3`
- [ ] Topics stored in session storage with proper structure

---

#### Step 3: Signup

1. Verify URL is `/articles/generate/step-3`
2. Verify page shows "Create Your Account" heading
3. Verify all form fields are displayed

**Actions:**

- Fill in the form:
  - Full Name: `Test User`
  - Email: `test-[timestamp]@example.com` (use unique email)
  - Job Title: `Marketing Manager`
  - Password: `TestPassword123!`
  - Confirm Password: `TestPassword123!`
  - Select delivery days: Mon, Wed, Fri
  - Select language: English
- Verify "Create Account" button is enabled
- Click "Create Account"

**Expected Results:**

- [ ] Loading state shown
- [ ] Email verification screen displayed
- [ ] Session storage cleared
- [ ] User account created in database with `subscription_status: 'incomplete'`

---

#### Step 4: Email Verification

1. Check email inbox for verification link
2. Click the verification link

**Expected Results:**

- [ ] User is automatically logged in
- [ ] Redirect to `/subscribe` page (since no active subscription)

---

#### Step 5: Plan Selection & Payment

1. Verify URL is `/subscribe`
2. Verify plan details are displayed
3. Click "Subscribe Now"

**Actions:**

- Verify Stripe checkout page loads
- Use test card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- Complete payment

**Expected Results:**

- [ ] Payment successful
- [ ] Redirect to `/dashboard?payment_success=true`
- [ ] User subscription_status updated to 'active'
- [ ] Article style record created from pending_style_data
- [ ] Google Sheets updated (if configured)

---

### Scenario 2: Session Persistence

**Objective:** Verify data persists across navigation and page refresh.

#### Test Navigation Persistence

1. Complete Step 1 with all 3 articles
2. Navigate to Step 2
3. Add 2 topics
4. Click "Back" button
5. Verify articles are still displayed in Step 1
6. Click "Continue" to return to Step 2
7. Verify topics are still displayed

**Expected Results:**

- [ ] All data preserved during navigation
- [ ] No data loss when going back/forward

#### Test Page Refresh Persistence

1. Complete Step 1 with all 3 articles
2. Navigate to Step 2
3. Add 3 topics
4. Refresh the page (F5)
5. Verify topics are restored
6. Navigate to Step 1
7. Refresh the page
8. Verify articles are restored

**Expected Results:**

- [ ] Data survives page refresh
- [ ] Session storage properly loaded on mount

---

### Scenario 3: Validation Testing

**Objective:** Verify all validation rules work correctly.

#### Step 1 Validation

| Test Case         | Action                           | Expected Result              |
| ----------------- | -------------------------------- | ---------------------------- |
| Empty articles    | Try to continue with no articles | Button disabled, error shown |
| One article only  | Add only 1 article               | Button disabled              |
| Two articles only | Add only 2 articles              | Button disabled              |
| All 3 articles    | Add all 3 articles               | Button enabled               |

#### Step 2 Validation

| Test Case       | Action                            | Expected Result                    |
| --------------- | --------------------------------- | ---------------------------------- |
| Empty topics    | Try to continue with no topics    | Button disabled, error shown       |
| Duplicate topic | Try to add same topic twice       | Topic not added (case-insensitive) |
| Empty string    | Try to add empty/whitespace topic | Topic not added                    |
| Valid topic     | Add valid topic text              | Topic added with badge             |

#### Step 3 Validation

| Test Case         | Action                     | Expected Result                                 |
| ----------------- | -------------------------- | ----------------------------------------------- |
| Short name        | Enter 1 character name     | Error: "Name must be at least 2 characters"     |
| Invalid email     | Enter "invalid-email"      | Error: "Please enter a valid email address"     |
| Short password    | Enter "short"              | Error: "Password must be at least 8 characters" |
| Password mismatch | Different confirm password | Error: "Passwords do not match"                 |
| No delivery days  | Don't select any days      | Error shown, button disabled                    |
| All valid         | Fill all fields correctly  | Button enabled                                  |

---

### Scenario 4: Error Handling

**Objective:** Verify error states are handled gracefully.

#### Duplicate Email

1. Complete Steps 1 and 2
2. In Step 3, use an email that already exists
3. Click "Create Account & Pay"

**Expected Results:**

- [ ] Error message: "An account with this email already exists"
- [ ] Form data preserved
- [ ] User can correct and retry

#### Payment Cancelled

1. Complete Steps 1, 2, and 3
2. On Stripe checkout, click "Back" or close the page
3. Verify redirect to `/articles/generate/step-3?cancelled=true`

**Expected Results:**

- [ ] Warning message about cancelled payment
- [ ] Form data preserved
- [ ] User can retry payment

---

### Scenario 5: Google Sheets Integration

**Objective:** Verify data syncs correctly to Google Sheets.

#### Prerequisites

- `GOOGLE_SHEETS_ARTICLES_ID` configured
- `GOOGLE_CREDENTIALS_PATH` configured
- Google Sheets API enabled

#### After Successful Signup

1. Complete full onboarding flow
2. Open Google Sheets spreadsheet
3. Check Main Sheet for new row

**Expected Main Sheet Columns:**
| Column | Expected Value |
|--------|----------------|
| Sheet Name | User's display name |
| Customer Name | Test User |
| Customer Email | test@example.com |
| Customer Job | Marketing Manager |
| Language | English |
| Email Monday | x |
| Email Wednesday | x |
| Email Friday | x |
| Paywall Status | Paid |
| Customer Sheet Created | Yes |
| Article 1 Example | First article content |
| Article 2 Example | Second article content |
| Article 3 Example | Third article content |

#### Check Customer Sheet

1. Find the new sheet created with user's name
2. Verify header row: `Topic | Status | Subject | Article | Last Update | Client`
3. Verify all topics are listed with "Needs Draft" status

**Expected Customer Sheet Data:**
| Topic | Status | Subject | Article | Last Update | Client |
|-------|--------|---------|---------|-------------|--------|
| How AI is Transforming... | Needs Draft | How AI is Transforming... | | 2025-12-09 | Test User |
| The 5 Email Marketing... | Needs Draft | The 5 Email Marketing... | | 2025-12-09 | Test User |
| ... | ... | ... | | ... | ... |

---

## Database Verification

After successful signup, verify these database records:

### user_profiles table

```sql
SELECT id, email, display_name, subscription_status, subscription_plan, job, onboarding_completed
FROM user_profiles
WHERE email = 'test@example.com';
```

**Expected:**

- `subscription_status`: 'active'
- `subscription_plan`: 'pro' (or selected plan)
- `onboarding_completed`: true

### article_styles table

```sql
SELECT id, user_id, name, style_samples, subjects, delivery_days, preferred_language
FROM article_styles
WHERE user_id = '<user_id>';
```

**Expected:**

- `style_samples`: Array with 3 articles
- `subjects`: Array with 5 topics
- `delivery_days`: ['mon', 'wed', 'fri']
- `preferred_language`: 'en'

---

## Cleanup

After testing, clean up test data:

```sql
-- Delete test user (cascade will handle related records)
DELETE FROM user_profiles WHERE email LIKE 'test-%@example.com';
```

For Google Sheets:

- Manually delete test rows from Main Sheet
- Delete test customer sheets

---

## Test Checklist Summary

### Happy Path

- [ ] Step 1: Add 3 sample articles
- [ ] Step 2: Add 5 topics
- [ ] Step 3: Complete signup form
- [ ] Email: Verify email address
- [ ] Subscribe: Select plan and complete payment
- [ ] Dashboard: Verify redirect

### Data Persistence

- [ ] Navigation back/forward preserves data
- [ ] Page refresh preserves data
- [ ] Session cleared after successful signup

### Validation

- [ ] Step 1: Requires all 3 articles
- [ ] Step 2: Requires at least 1 topic
- [ ] Step 3: All form validations work

### Error Handling

- [ ] Duplicate email shows error
- [ ] Cancelled payment shows warning on /subscribe
- [ ] Network errors handled gracefully

### Integration

- [ ] Database records created correctly
- [ ] Google Sheets synced (if configured)
- [ ] Stripe subscription active

---

## Notes

- Use Stripe test mode for all payment testing
- Test card: `4242 4242 4242 4242`
- For declined card testing: `4000 0000 0000 0002`
- Always use unique emails for each test run
