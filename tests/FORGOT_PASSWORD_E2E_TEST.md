# Manual E2E Test Guide - Forgot Password Flow

This document provides step-by-step instructions for manually testing the complete forgot password flow with Supabase integration.

## Prerequisites

Before testing, ensure:

- [ ] Development server is running (`npm run dev`)
- [ ] Supabase local instance is running (`npm run db:start`)
- [ ] Environment variables are set in `.env.local`
- [ ] A test user account exists (or create one via signup)
- [ ] Access to the test user's email inbox

## Test Data

### Test User Account

Create or use an existing test account:

- Email: `test-forgot-password@example.com`
- Password: `OldPassword123!`

---

## Test Scenarios

### Scenario 1: Complete Happy Path - Password Reset

**Objective:** Test the full forgot password flow from request to successful reset.

#### Step 1: Navigate to Forgot Password

1. Navigate to `http://localhost:3000/login`
2. Verify the "Forgot password?" link is visible below the password field
3. Click "Forgot password?" link
4. Verify URL is `/forgot-password`
5. Verify page shows "Forgot Password?" heading with key icon

**Expected Results:**

- [ ] Login page displays "Forgot password?" link
- [ ] Navigation to forgot password page works
- [ ] Page styling matches login page design

---

#### Step 2: Request Password Reset

1. Verify email input field is displayed
2. Verify "Send Reset Link" button is disabled initially
3. Enter test user email: `test-forgot-password@example.com`
4. Verify button becomes enabled
5. Click "Send Reset Link"

**Expected Results:**

- [ ] Loading state shown ("Sending...")
- [ ] Success screen displayed with "Check Your Email" heading
- [ ] Email address displayed on success screen
- [ ] "Open Email App" button visible
- [ ] "Back to Login" button visible
- [ ] "try again" link visible

---

#### Step 3: Check Email & Click Reset Link

1. Check email inbox for password reset email from Supabase
2. Verify email contains reset link
3. Click the reset link in the email

**Expected Results:**

- [ ] Email received within 1-2 minutes
- [ ] Email contains valid reset link
- [ ] Clicking link redirects to `/reset-password`
- [ ] User session is established (required for password update)

---

#### Step 4: Set New Password

1. Verify URL is `/reset-password`
2. Verify page shows "Set New Password" heading
3. Verify password requirements are displayed when typing
4. Enter new password: `NewPassword456!`
5. Verify password requirements update in real-time:
   - At least 8 characters ✓
   - One uppercase letter (A-Z) ✓
   - One lowercase letter (a-z) ✓
   - One number (0-9) ✓
   - One special character (!@#$%...) ✓
6. Enter confirm password: `NewPassword456!`
7. Click "Reset Password"

**Expected Results:**

- [ ] Password requirements show checkmarks for met criteria
- [ ] Passwords match validation passes
- [ ] Loading state shown ("Resetting...")
- [ ] Success screen displayed with "Password Reset!" heading
- [ ] "Continue to Login" button visible

---

#### Step 5: Login with New Password

1. Click "Continue to Login" button
2. Verify redirect to `/login`
3. Enter email: `test-forgot-password@example.com`
4. Enter new password: `NewPassword456!`
5. Click "Sign In"

**Expected Results:**

- [ ] Login successful
- [ ] Redirect to `/dashboard`
- [ ] Old password no longer works

---

### Scenario 2: Validation Testing

**Objective:** Verify all validation rules work correctly.

#### Forgot Password Page Validation

| Test Case            | Action                        | Expected Result                                         |
| -------------------- | ----------------------------- | ------------------------------------------------------- |
| Empty email          | Click submit with empty field | Button disabled                                         |
| Invalid email format | Enter "invalid-email"         | Error: "Please enter a valid email address"             |
| Valid email          | Enter valid email format      | Button enabled, no error                                |
| Non-existent email   | Enter email not in system     | Success shown (security - don't reveal if email exists) |

#### Reset Password Page Validation

| Test Case         | Action                      | Expected Result                      |
| ----------------- | --------------------------- | ------------------------------------ |
| Short password    | Enter "short"               | Requirements show X for length       |
| No uppercase      | Enter "password123!"        | Requirements show X for uppercase    |
| No lowercase      | Enter "PASSWORD123!"        | Requirements show X for lowercase    |
| No number         | Enter "Password!"           | Requirements show X for number       |
| No special char   | Enter "Password123"         | Requirements show X for special char |
| Password mismatch | Different confirm password  | Error: "Passwords do not match"      |
| All valid         | Enter "ValidPass123!" twice | All requirements met, button enabled |

---

### Scenario 3: Error Handling

**Objective:** Verify error states are handled gracefully.

#### Invalid/Expired Reset Link

1. Navigate directly to `/reset-password` without valid session
2. Try to reset password

**Expected Results:**

- [ ] Error message displayed
- [ ] User prompted to request new reset link

#### Expired Reset Link

1. Request password reset
2. Wait for link to expire (default: 1 hour in Supabase)
3. Click expired link

**Expected Results:**

- [ ] Redirect to `/forgot-password?error=invalid_reset_link`
- [ ] Error message: "The password reset link is invalid or has expired. Please request a new one."

---

### Scenario 4: Navigation & UX Testing

**Objective:** Verify navigation and user experience elements.

#### Back Navigation

1. Navigate to `/forgot-password`
2. Click "Back to Login" link
3. Verify redirect to `/login`

**Expected Results:**

- [ ] Navigation works correctly
- [ ] No errors displayed

#### Try Again Flow

1. Complete password reset request (success screen)
2. Click "try again" link
3. Verify form is reset and ready for new submission

**Expected Results:**

- [ ] Success screen hidden
- [ ] Form displayed again
- [ ] Email field cleared

#### Email Provider Detection

Test the "Open Email App" button with different email domains:

| Email Domain | Expected Provider URL             |
| ------------ | --------------------------------- |
| @gmail.com   | https://mail.google.com           |
| @outlook.com | https://outlook.live.com          |
| @hotmail.com | https://outlook.live.com          |
| @yahoo.com   | https://mail.yahoo.com            |
| @company.com | https://mail.google.com (default) |

---

### Scenario 5: Security Testing

**Objective:** Verify security measures are in place.

#### Rate Limiting (if configured)

1. Request password reset multiple times rapidly
2. Verify rate limiting kicks in

**Expected Results:**

- [ ] After X attempts, rate limit error shown
- [ ] User must wait before trying again

#### Email Enumeration Prevention

1. Enter email that doesn't exist in system
2. Submit reset request

**Expected Results:**

- [ ] Same success message shown (doesn't reveal if email exists)
- [ ] No email sent (but user doesn't know this)

#### Session Handling

1. Complete password reset
2. Verify old sessions are invalidated

**Expected Results:**

- [ ] User must log in again with new password
- [ ] Old sessions no longer valid

---

## UI/UX Verification Checklist

### Forgot Password Page (`/forgot-password`)

- [ ] Header component displayed
- [ ] Floating 3D shapes animation working
- [ ] Card has proper shadow and blur effects
- [ ] Key icon displayed in header
- [ ] Form validation shows inline errors
- [ ] Loading state shows spinner
- [ ] Success state shows email icon
- [ ] Responsive design works on mobile

### Reset Password Page (`/reset-password`)

- [ ] Header component displayed
- [ ] Floating 3D shapes animation working
- [ ] Card has proper shadow and blur effects
- [ ] Key icon displayed in header
- [ ] Password requirements update in real-time
- [ ] Checkmarks/X icons show requirement status
- [ ] Password mismatch error shows inline
- [ ] Loading state shows spinner
- [ ] Success state shows checkmark icon
- [ ] Responsive design works on mobile

### Login Page (`/login`)

- [ ] "Forgot password?" link visible
- [ ] Link positioned correctly (right side of password label)
- [ ] Link navigates to `/forgot-password`

---

## Database Verification

After successful password reset, verify:

```sql
-- Check user's last sign in was updated
SELECT id, email, last_sign_in_at, updated_at
FROM auth.users
WHERE email = 'test-forgot-password@example.com';
```

**Expected:**

- `updated_at` should reflect the password change time

---

## Test Checklist Summary

### Happy Path

- [ ] Navigate from login to forgot password
- [ ] Submit email for reset
- [ ] Receive reset email
- [ ] Click reset link
- [ ] Set new password with all requirements met
- [ ] Login with new password

### Validation

- [ ] Email validation on forgot password page
- [ ] Password requirements validation
- [ ] Password confirmation matching
- [ ] Empty field handling

### Error Handling

- [ ] Invalid/expired reset link
- [ ] Network errors handled gracefully
- [ ] Rate limiting (if configured)

### Security

- [ ] Email enumeration prevention
- [ ] Session invalidation after reset
- [ ] Password requirements enforced

### UI/UX

- [ ] Consistent styling with login page
- [ ] Animations working
- [ ] Responsive design
- [ ] Loading states
- [ ] Success states

---

## Notes

- Supabase default reset link expiry: 1 hour
- Password requirements: 8+ chars, uppercase, lowercase, number, special char
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test on mobile devices for responsive design
- Check email spam folder if reset email not received
