# Design Document: Admin Prompt Management

## Overview

This feature adds an administrative interface for managing AI prompts used in the "Generate Ideas" functionality during Step 2 of the article style generation process. The system allows administrators to customize system and user prompts with dynamic variable support, enabling real-time customization without code changes.

The implementation follows the existing `app_config` table pattern used for other admin settings, ensuring consistency with the current architecture.

## Architecture

```mermaid
flowchart TB
    subgraph Admin["Admin Panel"]
        AP[Prompt Management Page]
        PE[Prompt Editor Component]
        PV[Preview Component]
    end

    subgraph API["API Layer"]
        PA[/api/admin/prompts]
        PS[Prompt Service]
    end

    subgraph DB["Database"]
        AC[(app_config table)]
    end

    subgraph Generation["Topic Generation"]
        AI[/api/ai/suggestions]
        OS[OpenAI Service]
    end

    AP --> PE
    AP --> PV
    PE --> PA
    PA --> PS
    PS --> AC
    AI --> PS
    PS --> OS
    OS --> OpenAI[OpenAI API]
```

## Components and Interfaces

### 1. Admin Prompt Management Page

- Location: `app/admin/prompts/page.tsx`
- Displays editable text areas for system and user prompts
- Shows available dynamic variables with descriptions
- Provides preview and reset functionality
- Uses existing admin layout and authentication

### 2. Prompt Service

- Location: `lib/services/prompt-config.ts`
- Handles CRUD operations for prompt configurations
- Provides variable substitution logic
- Manages default prompt fallbacks

### 3. API Routes

- Location: `app/api/admin/prompts/route.ts`
- GET: Retrieve current prompts (custom or default)
- PUT: Save updated prompts
- POST: Reset to default prompts

### 4. Updated OpenAI Service

- Location: `lib/services/openai.ts` (modified)
- Integrates with prompt service to fetch custom prompts
- Applies variable substitution before API calls

## Data Models

### Prompt Configuration (stored in app_config)

```typescript
interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
}

// Database keys in app_config table
// - 'ai_system_prompt': System prompt template
// - 'ai_user_prompt': User prompt template
```

### Dynamic Variables

```typescript
interface PromptVariables {
  job_title: string; // User's job title (e.g., "LinkedIn content creator")
  existing_topics: string; // Formatted list of existing topics
  count: number; // Number of suggestions to generate
  style_samples: string; // User's writing style samples
}

// Variable format in prompts: {{variable_name}}
```

### Default Prompts

```typescript
const DEFAULT_SYSTEM_PROMPT = `You're a LinkedIn topic drafter. Your job is to act as a {{job_title}}, look at the topic ideas already drafted and generate {{count}} more like it that are different enough to be novel.

Each topic should be:
- Specific and actionable
- Written as a compelling LinkedIn post title
- Different from the existing topics but in a similar professional domain
- Formatted like: "Why [Problem/Observation]—And [Solution/Insight]"

Return ONLY a JSON array of topic strings, nothing else.`;

const DEFAULT_USER_PROMPT = `Here are the existing topic ideas:
{{existing_topics}}

Generate {{count}} new topic ideas that are different but related to these themes.

Return only a JSON array of {{count}} topic strings.`;
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Prompt Save Round-Trip

_For any_ valid non-empty prompt string, saving it to the database and then retrieving it should return an equivalent string.
**Validates: Requirements 1.2**

### Property 2: Empty Prompt Rejection

_For any_ string composed entirely of whitespace (including empty string), attempting to save it as a prompt should be rejected and the original prompt should remain unchanged.
**Validates: Requirements 1.4**

### Property 3: Supported Variable Substitution

_For any_ prompt containing supported variables (`{{job_title}}`, `{{existing_topics}}`, `{{count}}`, `{{style_samples}}`) and any valid context object, all supported variables should be replaced with their corresponding values from the context.
**Validates: Requirements 2.2, 2.4, 3.4**

### Property 4: Unsupported Variable Preservation

_For any_ prompt containing unsupported variables (variables not in the supported list), those variable placeholders should remain unchanged in the output after substitution.
**Validates: Requirements 2.3**

### Property 5: Custom Prompt Priority

_For any_ scenario where custom prompts exist in the database, the topic generation should use the custom prompts instead of the default prompts.
**Validates: Requirements 3.2**

### Property 6: Preview Variable Substitution

_For any_ prompt template and sample context, the preview function should return the prompt with all supported variables replaced by sample values.
**Validates: Requirements 4.1**

### Property 7: Reset Restores Defaults

_For any_ state of custom prompts, after executing the reset operation, the prompts should equal the default prompt values.
**Validates: Requirements 5.2**

## Error Handling

### API Error Handling

- 400: Invalid request (empty prompts, malformed JSON)
- 401: Unauthorized (non-admin access)
- 500: Database or server errors

### Frontend Error Handling

- Field-level validation for empty prompts
- Toast notifications for API errors and success confirmations
- Loading states during save/reset operations

### Variable Substitution Errors

- Missing variables in context: Use empty string or default value
- Invalid variable format: Leave unchanged (treated as regular text)

## Testing Strategy

### Dual Testing Approach

This feature uses both unit tests and property-based tests:

- Unit tests verify specific examples and edge cases
- Property-based tests verify universal properties across all inputs

### Property-Based Testing

- Library: `fast-check` (already available in the project via vitest)
- Minimum iterations: 100 per property test
- Each property test is tagged with the corresponding correctness property

### Test Files

1. `lib/services/prompt-config.test.ts`
   - Property tests for variable substitution
   - Property tests for prompt validation
   - Unit tests for edge cases

2. `app/api/admin/prompts/route.test.ts`
   - Integration tests for API endpoints
   - Unit tests for request validation

### Test Coverage

| Property                          | Test Type | Test File             |
| --------------------------------- | --------- | --------------------- |
| Property 1: Save Round-Trip       | Property  | prompt-config.test.ts |
| Property 2: Empty Rejection       | Property  | prompt-config.test.ts |
| Property 3: Variable Substitution | Property  | prompt-config.test.ts |
| Property 4: Unsupported Variables | Property  | prompt-config.test.ts |
| Property 5: Custom Priority       | Unit      | prompt-config.test.ts |
| Property 6: Preview Substitution  | Property  | prompt-config.test.ts |
| Property 7: Reset Defaults        | Unit      | prompt-config.test.ts |
