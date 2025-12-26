/**
 * Password Validation Utility
 * Validates passwords against security requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const MIN_PASSWORD_LENGTH = 8;
const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * Checks individual password requirements
 */
export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: SPECIAL_CHARS_REGEX.test(password),
  };
}

/**
 * Validates a password against all security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
    };
  }

  const requirements = checkPasswordRequirements(password);

  if (!requirements.minLength) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  if (!requirements.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!requirements.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!requirements.hasNumber) {
    errors.push('Password must contain at least one number');
  }

  if (!requirements.hasSpecialChar) {
    errors.push(
      'Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Returns a human-readable list of password requirements
 */
export function getPasswordRequirementsList(): string[] {
  return [
    `At least ${MIN_PASSWORD_LENGTH} characters`,
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    'At least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)',
  ];
}
