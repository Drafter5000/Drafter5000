# Design Document

## Overview

The Contact Us page provides a dedicated, professional interface for users to reach out to the company. It leverages the existing Resend email service and API infrastructure while adding a comprehensive standalone page with enhanced UX features.

## Architecture

The feature follows the existing Next.js App Router architecture:

```
app/contact/page.tsx          - Contact page component
components/contact/           - Contact-specific components
  contact-form.tsx           - Main form component
lib/services/email.ts        - Email service (existing, enhanced)
app/api/contact/route.ts     - API endpoint (existing, enhanced)
```

## Components and Interfaces

### ContactForm Component

```typescript
interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: ContactCategory;
  message: string;
}

type ContactCategory = 'general' | 'support' | 'sales' | 'partnership' | 'other';

interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  category?: string;
  message?: string;
}

interface ContactFormProps {
  onSuccess?: () => void;
}
```

### API Request/Response

```typescript
// Request body
interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: ContactCategory;
  message: string;
}

// Response
interface ContactResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

## Data Models

### Form Validation Rules

| Field    | Required | Min Length | Max Length | Format |
| -------- | -------- | ---------- | ---------- | ------ |
| name     | Yes      | 2          | 100        | Text   |
| email    | Yes      | -          | 254        | Email  |
| phone    | No       | -          | 20         | Phone  |
| subject  | Yes      | 5          | 200        | Text   |
| category | Yes      | -          | -          | Enum   |
| message  | Yes      | 10         | 5000       | Text   |

### Category Options

```typescript
const CONTACT_CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Technical Support' },
  { value: 'sales', label: 'Sales Question' },
  { value: 'partnership', label: 'Partnership Opportunity' },
  { value: 'other', label: 'Other' },
] as const;
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Required Field Validation

_For any_ form submission attempt with empty required fields, the validation system should reject the submission and display appropriate error messages for each empty required field.

**Validates: Requirements 3.1**

### Property 2: Email Format Validation

_For any_ string that does not match the email format pattern, the validation system should reject it and display an email format error.

**Validates: Requirements 3.2**

### Property 3: Form Reset on Success

_For any_ successful form submission, all form fields should be reset to their initial empty state.

**Validates: Requirements 4.3**

### Property 4: Email Contains All Fields

_For any_ valid form submission, the sent email should contain all submitted field values (name, email, phone if provided, subject, category, message).

**Validates: Requirements 5.2**

## Error Handling

### Client-Side Errors

- Display inline validation errors below each field
- Show toast notification for submission failures
- Maintain form state on error for easy correction

### Server-Side Errors

| Error                  | Status Code | User Message                                |
| ---------------------- | ----------- | ------------------------------------------- |
| Invalid body           | 400         | "Invalid request"                           |
| Missing required field | 400         | "{field} is required"                       |
| Invalid email format   | 400         | "Invalid email address"                     |
| Email service error    | 500         | "Failed to send message. Please try again." |

## Testing Strategy

### Unit Tests

- Form validation logic
- Email format validation
- Category selection handling

### Property-Based Tests

- Validation rejects all invalid inputs
- Valid submissions always include all required data

### Integration Tests

- API endpoint accepts valid requests
- API endpoint rejects invalid requests
- Email service integration
