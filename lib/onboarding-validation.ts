/**
 * Onboarding Form Validation Utilities
 *
 * Provides validation functions for the 3-step onboarding flow.
 */

/**
 * Counts the number of words in a text string.
 * Words are defined as whitespace-separated non-empty tokens.
 *
 * @param text - The input text to count words in
 * @returns The number of words in the text
 *
 * Requirements: 1.2
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') {
    return 0;
  }
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Validates whether the style samples array enables the continue button.
 * At least one non-empty (after trimming) sample is required.
 *
 * @param samples - Array of style sample strings (typically 3)
 * @returns true if at least one sample has non-zero length after trimming
 *
 * Requirements: 1.3, 1.5
 */
export function isStyleSampleValid(samples: string[]): boolean {
  return samples.some(sample => sample.trim().length > 0);
}

/**
 * Validates a single style sample text.
 * Returns true if the text has at least 100 characters.
 *
 * @param text - The style sample text to validate
 * @returns true if length >= 100 characters
 *
 * Requirements: 2.2
 */
export function validateStyleSample(text: string): boolean {
  return text.length >= 100;
}

/**
 * Validates a single topic text.
 * Returns true if the text length is between 3 and 200 characters inclusive.
 *
 * @param text - The topic text to validate
 * @returns true if length is between 3 and 200 characters
 *
 * Requirements: 3.2
 */
export function validateTopic(text: string): boolean {
  const length = text.length;
  return length >= 3 && length <= 200;
}

/**
 * Validates whether a subject can be added to the existing list.
 * A subject is valid if it is non-empty, not whitespace-only, and not a duplicate.
 *
 * @param subject - The subject string to validate
 * @param existingSubjects - Array of already added subjects
 * @returns true if the subject can be added
 *
 * Requirements: 2.2, 2.6
 */
export function isSubjectValid(subject: string, existingSubjects: string[]): boolean {
  const trimmed = subject.trim();
  if (trimmed === '') {
    return false;
  }
  // Check for duplicates (case-insensitive)
  return !existingSubjects.some(existing => existing.toLowerCase() === trimmed.toLowerCase());
}

/**
 * Validates whether the subject list enables the continue button.
 * At least one subject is required.
 *
 * @param subjects - Array of subject strings
 * @returns true if the list contains at least one element
 *
 * Requirements: 2.5
 */
export function isSubjectListValid(subjects: string[]): boolean {
  return subjects.length > 0;
}

/**
 * Validates whether the Step 3 form enables the complete button.
 * All required fields must be non-empty and at least one delivery day selected.
 *
 * @param email - User's email address
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param deliveryDays - Array of selected delivery day codes
 * @returns true if all required fields are valid
 *
 * Requirements: 3.4, 3.5
 */
export function isStep3FormValid(
  email: string,
  firstName: string,
  lastName: string,
  deliveryDays: string[]
): boolean {
  return (
    email.trim().length > 0 &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    deliveryDays.length > 0
  );
}

/**
 * Validation result for signup form
 */
export interface SignupValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    job?: string;
  };
}

/**
 * Validates signup form data.
 * Returns validation result with errors for each invalid field.
 *
 * @param data - The signup form data to validate
 * @returns ValidationResult with valid flag and field errors
 *
 * Requirements: 4.2
 */
export function validateSignupForm(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  job: string;
}): SignupValidationResult {
  const errors: SignupValidationResult['errors'] = {};

  // Name validation: minimum 2 characters
  if (data.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  // Email validation: valid email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation: minimum 8 characters
  if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  // Confirm password validation: must match password
  if (data.confirmPassword !== data.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Job validation: minimum 2 characters
  if (data.job.length < 2) {
    errors.job = 'Job must be at least 2 characters';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Selects an AI suggestion and moves it from suggestions to subjects.
 * Returns the updated subjects and suggestions arrays.
 *
 * @param subjects - Current array of subjects
 * @param suggestions - Current array of AI suggestions
 * @param suggestion - The suggestion to select
 * @returns Object with updated subjects and suggestions arrays
 *
 * Requirements: 2.4
 */
export function selectAISuggestion(
  subjects: string[],
  suggestions: string[],
  suggestion: string
): { subjects: string[]; suggestions: string[] } {
  // Only add if valid (not duplicate, not empty)
  if (!isSubjectValid(suggestion, subjects)) {
    return { subjects, suggestions };
  }

  return {
    subjects: [...subjects, suggestion],
    suggestions: suggestions.filter(s => s !== suggestion),
  };
}
