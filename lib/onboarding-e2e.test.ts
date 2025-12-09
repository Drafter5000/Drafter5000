/**
 * E2E Test File for Onboarding Signup Flow
 *
 * This file contains manual E2E test scenarios for the onboarding signup flow.
 * These tests are designed to be run manually to verify the complete flow works correctly.
 *
 * Prerequisites:
 * - Development server running (npm run dev)
 * - Supabase local instance running (npm run db:start)
 * - Stripe test mode configured
 * - Google Sheets API configured (optional)
 *
 * Test Environment Setup:
 * 1. Run the database migration: scripts/13-add-job-field.sql
 * 2. Ensure Stripe webhook is configured for local testing
 * 3. Use Stripe test card: 4242 4242 4242 4242
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DraftSessionService, DraftSession } from './draft-session';
import {
  validateStyleSample,
  validateTopic,
  validateSignupForm,
  isStyleSampleValid,
  isSubjectListValid,
} from './onboarding-validation';

// Mock sessionStorage for testing
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('E2E: Onboarding Signup Flow', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('Step 1: Writing Style', () => {
    /**
     * Manual Test Scenario 1.1: Navigate to Step 1
     *
     * Steps:
     * 1. Open browser to http://localhost:3000
     * 2. Click "Get Started Free" button
     * 3. Verify URL is /articles/generate/step-1
     * 4. Verify page shows "Define Your Writing Style" heading
     * 5. Verify 3 text areas are displayed for article samples
     * 6. Verify "Continue" button is disabled initially
     */
    it('should validate style samples correctly', () => {
      // Test: Empty samples should not be valid
      expect(isStyleSampleValid([])).toBe(false);
      expect(isStyleSampleValid(['', '', ''])).toBe(false);

      // Test: Less than 3 non-empty samples should not be valid
      expect(isStyleSampleValid(['Sample text', '', ''])).toBe(false);
      expect(isStyleSampleValid(['', 'Sample text', ''])).toBe(false);
      expect(isStyleSampleValid(['Sample 1', 'Sample 2', ''])).toBe(false);

      // Test: All 3 non-empty samples should be valid
      expect(isStyleSampleValid(['Sample 1', 'Sample 2', 'Sample 3'])).toBe(true);
    });

    /**
     * Manual Test Scenario 1.2: Add Style Sample
     *
     * Steps:
     * 1. Paste an article (100+ characters) into Article 1 textarea
     * 2. Verify word count updates
     * 3. Verify "Continue" button becomes enabled
     * 4. Click "Continue"
     * 5. Verify navigation to /articles/generate/step-2
     */
    it('should validate individual style sample length', () => {
      // Less than 100 characters should be invalid
      expect(validateStyleSample('Short text')).toBe(false);
      expect(validateStyleSample('a'.repeat(99))).toBe(false);

      // 100+ characters should be valid
      expect(validateStyleSample('a'.repeat(100))).toBe(true);
      expect(validateStyleSample('a'.repeat(500))).toBe(true);
    });

    it('should save style samples to draft session', () => {
      const samples = ['Sample article 1 with enough content', 'Sample article 2', 'Sample 3'];

      DraftSessionService.saveSampleArticles(samples);
      DraftSessionService.save({ current_step: 2 });

      const loaded = DraftSessionService.load();
      expect(loaded?.style_samples).toEqual(samples);
      expect(loaded?.sample_articles).toHaveLength(3);
      expect(loaded?.sample_articles?.[0].content).toBe('Sample article 1 with enough content');
      expect(loaded?.sample_articles?.[0].wordCount).toBe(5);
      expect(loaded?.current_step).toBe(2);
    });
  });

  describe('Step 2: Topics', () => {
    /**
     * Manual Test Scenario 2.1: Navigate to Step 2
     *
     * Steps:
     * 1. Complete Step 1 with valid style sample
     * 2. Verify URL is /articles/generate/step-2
     * 3. Verify page shows "Choose Your Topics" heading
     * 4. Verify topic input field is displayed
     * 5. Verify "Continue" button is disabled initially
     */
    it('should validate topic length correctly', () => {
      // Less than 3 characters should be invalid
      expect(validateTopic('')).toBe(false);
      expect(validateTopic('ab')).toBe(false);

      // 3-200 characters should be valid
      expect(validateTopic('abc')).toBe(true);
      expect(validateTopic('a'.repeat(200))).toBe(true);

      // More than 200 characters should be invalid
      expect(validateTopic('a'.repeat(201))).toBe(false);
    });

    /**
     * Manual Test Scenario 2.2: Add Topics
     *
     * Steps:
     * 1. Type a topic in the input field
     * 2. Press Enter or click Add button
     * 3. Verify topic appears in the list
     * 4. Add at least one more topic
     * 5. Verify "Continue" button becomes enabled
     * 6. Click "Continue"
     * 7. Verify navigation to /articles/generate/step-3
     */
    it('should validate subject list correctly', () => {
      expect(isSubjectListValid([])).toBe(false);
      expect(isSubjectListValid(['Topic 1'])).toBe(true);
      expect(isSubjectListValid(['Topic 1', 'Topic 2'])).toBe(true);
    });

    it('should save subjects to draft session with topic entries', () => {
      // First save style samples (required for step 2)
      DraftSessionService.saveSampleArticles(['Sample article 1', 'Sample 2', 'Sample 3']);
      DraftSessionService.save({ current_step: 2 });

      // Then save subjects as topic entries
      DraftSessionService.saveTopicEntries(['Topic 1', 'Topic 2', 'Topic 3']);
      DraftSessionService.save({ current_step: 3 });

      const loaded = DraftSessionService.load();
      expect(loaded?.subjects).toEqual(['Topic 1', 'Topic 2', 'Topic 3']);
      expect(loaded?.topic_entries).toHaveLength(3);
      expect(loaded?.topic_entries?.[0].topic).toBe('Topic 1');
      expect(loaded?.topic_entries?.[0].status).toBe('Needs Draft');
      expect(loaded?.topic_entries?.[0].subject).toBe('Topic 1');
      expect(loaded?.topic_entries?.[0].article).toBe('');
      expect(loaded?.current_step).toBe(3);
    });
  });

  describe('Step 3: Signup + Payment', () => {
    /**
     * Manual Test Scenario 3.1: Navigate to Step 3
     *
     * Steps:
     * 1. Complete Steps 1 and 2 with valid data
     * 2. Verify URL is /articles/generate/step-3
     * 3. Verify page shows "Create Your Account" heading
     * 4. Verify signup form fields are displayed:
     *    - Full Name
     *    - Email Address
     *    - Job Title
     *    - Password
     *    - Confirm Password
     *    - Delivery Days
     *    - Article Language
     * 5. Verify "Create Account & Pay" button is disabled initially
     */
    it('should validate signup form correctly', () => {
      // All fields invalid
      const invalidResult = validateSignupForm({
        name: 'A',
        email: 'invalid',
        password: 'short',
        confirmPassword: 'different',
        job: 'X',
      });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.name).toBeDefined();
      expect(invalidResult.errors.email).toBeDefined();
      expect(invalidResult.errors.password).toBeDefined();
      expect(invalidResult.errors.confirmPassword).toBeDefined();
      expect(invalidResult.errors.job).toBeDefined();

      // All fields valid
      const validResult = validateSignupForm({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        job: 'Developer',
      });
      expect(validResult.valid).toBe(true);
      expect(Object.keys(validResult.errors)).toHaveLength(0);
    });

    /**
     * Manual Test Scenario 3.2: Complete Signup Form
     *
     * Steps:
     * 1. Fill in Full Name: "Test User"
     * 2. Fill in Email: "test@example.com"
     * 3. Fill in Job Title: "Software Developer"
     * 4. Fill in Password: "testpassword123"
     * 5. Fill in Confirm Password: "testpassword123"
     * 6. Select delivery days (e.g., Mon, Wed, Fri)
     * 7. Select language (e.g., English)
     * 8. Verify "Create Account & Pay" button becomes enabled
     * 9. Click "Create Account & Pay"
     * 10. Verify redirect to Stripe checkout page
     */
    it('should validate name field', () => {
      expect(
        validateSignupForm({
          name: 'A',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          job: 'Developer',
        }).errors.name
      ).toBeDefined();

      expect(
        validateSignupForm({
          name: 'Jo',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          job: 'Developer',
        }).errors.name
      ).toBeUndefined();
    });

    it('should validate email field', () => {
      expect(
        validateSignupForm({
          name: 'John',
          email: 'invalid-email',
          password: 'password123',
          confirmPassword: 'password123',
          job: 'Developer',
        }).errors.email
      ).toBeDefined();

      expect(
        validateSignupForm({
          name: 'John',
          email: 'valid@email.com',
          password: 'password123',
          confirmPassword: 'password123',
          job: 'Developer',
        }).errors.email
      ).toBeUndefined();
    });

    it('should validate password field', () => {
      expect(
        validateSignupForm({
          name: 'John',
          email: 'test@example.com',
          password: 'short',
          confirmPassword: 'short',
          job: 'Developer',
        }).errors.password
      ).toBeDefined();

      expect(
        validateSignupForm({
          name: 'John',
          email: 'test@example.com',
          password: 'longenough',
          confirmPassword: 'longenough',
          job: 'Developer',
        }).errors.password
      ).toBeUndefined();
    });

    it('should validate password confirmation', () => {
      expect(
        validateSignupForm({
          name: 'John',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'different123',
          job: 'Developer',
        }).errors.confirmPassword
      ).toBeDefined();

      expect(
        validateSignupForm({
          name: 'John',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          job: 'Developer',
        }).errors.confirmPassword
      ).toBeUndefined();
    });

    it('should validate job field', () => {
      expect(
        validateSignupForm({
          name: 'John',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          job: 'X',
        }).errors.job
      ).toBeDefined();

      expect(
        validateSignupForm({
          name: 'John',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          job: 'Developer',
        }).errors.job
      ).toBeUndefined();
    });
  });

  describe('Draft Session Persistence', () => {
    /**
     * Manual Test Scenario 4.1: Session Persistence on Navigation
     *
     * Steps:
     * 1. Complete Step 1 with style samples
     * 2. Navigate to Step 2
     * 3. Click "Back" button
     * 4. Verify style samples are still displayed
     * 5. Navigate forward to Step 2
     * 6. Add topics
     * 7. Navigate to Step 3
     * 8. Click "Back" button
     * 9. Verify topics are still displayed
     */
    it('should persist data across navigation', () => {
      // Simulate Step 1
      DraftSessionService.save({
        style_samples: ['Article 1', 'Article 2'],
        current_step: 2,
      });

      // Simulate Step 2
      DraftSessionService.save({
        subjects: ['Topic 1', 'Topic 2'],
        current_step: 3,
      });

      // Verify all data persists
      const loaded = DraftSessionService.load();
      expect(loaded?.style_samples).toEqual(['Article 1', 'Article 2']);
      expect(loaded?.subjects).toEqual(['Topic 1', 'Topic 2']);
    });

    /**
     * Manual Test Scenario 4.2: Session Persistence on Page Refresh
     *
     * Steps:
     * 1. Complete Step 1 with style samples
     * 2. Refresh the page (F5)
     * 3. Verify style samples are restored
     * 4. Navigate to Step 2 and add topics
     * 5. Refresh the page
     * 6. Verify topics are restored
     */
    it('should persist data across page refresh', () => {
      // Save data
      DraftSessionService.save({
        style_samples: ['Article 1'],
        subjects: ['Topic 1'],
        preferred_language: 'es',
        delivery_days: ['mon', 'wed', 'fri'],
        current_step: 3,
      });

      // Simulate page refresh by reading directly from storage
      const storedValue = mockSessionStorage.getItem('onboarding_draft_session');
      expect(storedValue).not.toBeNull();

      const parsed = JSON.parse(storedValue!) as DraftSession;
      expect(parsed.style_samples).toEqual(['Article 1']);
      expect(parsed.subjects).toEqual(['Topic 1']);
      expect(parsed.preferred_language).toBe('es');
      expect(parsed.delivery_days).toEqual(['mon', 'wed', 'fri']);
    });

    /**
     * Manual Test Scenario 4.3: Session Clear on Success
     *
     * Steps:
     * 1. Complete the entire flow through payment
     * 2. After successful payment, verify redirect to dashboard
     * 3. Open browser dev tools > Application > Session Storage
     * 4. Verify onboarding_draft_session is cleared
     */
    it('should clear session on success', () => {
      // Save data
      DraftSessionService.save({
        style_samples: ['Article 1'],
        subjects: ['Topic 1'],
        current_step: 3,
      });

      expect(DraftSessionService.exists()).toBe(true);

      // Clear session (simulating successful signup)
      DraftSessionService.clear();

      expect(DraftSessionService.exists()).toBe(false);
      expect(DraftSessionService.load()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    /**
     * Manual Test Scenario 5.1: Duplicate Email Error
     *
     * Steps:
     * 1. Complete Steps 1 and 2
     * 2. In Step 3, enter an email that already exists
     * 3. Click "Create Account & Pay"
     * 4. Verify error message: "An account with this email already exists"
     */
    it('should handle validation errors gracefully', () => {
      const result = validateSignupForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        job: '',
      });

      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });

    /**
     * Manual Test Scenario 5.2: Payment Cancelled
     *
     * Steps:
     * 1. Complete Steps 1, 2, and 3
     * 2. On Stripe checkout page, click "Back" or close the page
     * 3. Verify redirect to /articles/generate/step-3?cancelled=true
     * 4. Verify error message about cancelled payment
     * 5. Verify form data is preserved
     */
    it('should preserve draft data on payment cancellation', () => {
      // Save complete draft data
      DraftSessionService.save({
        style_samples: ['Article 1'],
        subjects: ['Topic 1'],
        preferred_language: 'en',
        delivery_days: ['mon'],
        current_step: 3,
      });

      // Simulate payment cancellation (data should still exist)
      const loaded = DraftSessionService.load();
      expect(loaded).not.toBeNull();
      expect(loaded?.style_samples).toEqual(['Article 1']);
    });
  });
});

/**
 * MANUAL E2E TEST CHECKLIST
 *
 * Run these tests manually in the browser:
 *
 * [ ] 1. Landing Page to Step 1
 *     - Click "Get Started Free" on landing page
 *     - Verify navigation to /articles/generate/step-1
 *
 * [ ] 2. Step 1: Writing Style
 *     - Verify 3 text areas displayed
 *     - Verify Continue button disabled initially
 *     - Add article sample (100+ chars)
 *     - Verify Continue button enabled
 *     - Click Continue
 *     - Verify navigation to Step 2
 *
 * [ ] 3. Step 2: Topics
 *     - Verify topic input displayed
 *     - Verify Continue button disabled initially
 *     - Add at least one topic
 *     - Verify Continue button enabled
 *     - Click Continue
 *     - Verify navigation to Step 3
 *
 * [ ] 4. Step 3: Signup + Payment
 *     - Verify all form fields displayed
 *     - Fill in valid data
 *     - Select delivery days
 *     - Select language
 *     - Click "Create Account & Pay"
 *     - Verify redirect to Stripe checkout
 *
 * [ ] 5. Stripe Checkout
 *     - Use test card: 4242 4242 4242 4242
 *     - Complete payment
 *     - Verify redirect to dashboard
 *
 * [ ] 6. Post-Payment Verification
 *     - Verify user account created
 *     - Verify article_style record created
 *     - Verify Google Sheets sync (if configured)
 *     - Verify draft session cleared
 *
 * [ ] 7. Navigation Persistence
 *     - Go back from Step 2 to Step 1
 *     - Verify data preserved
 *     - Go forward to Step 2
 *     - Verify data preserved
 *
 * [ ] 8. Page Refresh Persistence
 *     - Refresh page on Step 2
 *     - Verify data restored
 *
 * [ ] 9. Error Handling
 *     - Try duplicate email
 *     - Verify error message
 *     - Cancel Stripe payment
 *     - Verify return to Step 3 with data preserved
 */
