# Implementation Plan

- [x] 1. Create prompt configuration service
  - [x] 1.1 Create prompt config types and constants
    - Create `lib/services/prompt-config.ts` with TypeScript interfaces
    - Define `PromptConfig`, `PromptVariables` interfaces
    - Define default system and user prompts as constants
    - Define supported variable names list
    - _Requirements: 2.4_

  - [x] 1.2 Implement variable substitution function
    - Create `substituteVariables(template: string, variables: PromptVariables): string`
    - Handle supported variables replacement
    - Leave unsupported variables unchanged
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]\* 1.3 Write property test for variable substitution
    - **Property 3: Supported Variable Substitution**
    - **Validates: Requirements 2.2, 2.4, 3.4**

  - [ ]\* 1.4 Write property test for unsupported variable preservation
    - **Property 4: Unsupported Variable Preservation**
    - **Validates: Requirements 2.3**

  - [x] 1.5 Implement prompt validation function
    - Create `validatePrompt(prompt: string): { valid: boolean; error?: string }`
    - Reject empty or whitespace-only prompts
    - _Requirements: 1.4_

  - [ ]\* 1.6 Write property test for empty prompt rejection
    - **Property 2: Empty Prompt Rejection**
    - **Validates: Requirements 1.4**

  - [x] 1.7 Implement database operations
    - Create `getPromptConfig(): Promise<PromptConfig>` - fetch from app_config or return defaults
    - Create `savePromptConfig(config: PromptConfig): Promise<void>` - save to app_config
    - Create `resetPromptConfig(): Promise<void>` - reset to defaults
    - _Requirements: 1.2, 1.3, 3.2, 3.3, 5.2_

  - [ ]\* 1.8 Write property test for save round-trip
    - **Property 1: Prompt Save Round-Trip**
    - **Validates: Requirements 1.2**

  - [ ]\* 1.9 Write unit test for custom prompt priority
    - **Property 5: Custom Prompt Priority**
    - **Validates: Requirements 3.2**

  - [ ]\* 1.10 Write unit test for reset restores defaults
    - **Property 7: Reset Restores Defaults**
    - **Validates: Requirements 5.2**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create admin prompts API routes
  - [x] 3.1 Create GET endpoint for fetching prompts
    - Create `app/api/admin/prompts/route.ts`
    - Implement GET handler to return current prompts
    - Include admin authentication check
    - Return default prompts if no custom prompts exist
    - _Requirements: 1.1, 1.3, 3.3_

  - [x] 3.2 Create PUT endpoint for saving prompts
    - Implement PUT handler to save updated prompts
    - Validate prompts before saving
    - Return appropriate error responses for validation failures
    - _Requirements: 1.2, 1.4_

  - [x] 3.3 Create POST endpoint for resetting prompts
    - Implement POST handler for reset operation
    - Reset prompts to default values
    - _Requirements: 5.2_

- [-] 4. Create admin prompt management page
  - [x] 4.1 Create prompt management page component
    - Create `app/admin/prompts/page.tsx`
    - Add page to admin navigation
    - Implement loading state and error handling
    - _Requirements: 1.1_

  - [x] 4.2 Implement prompt editor form
    - Add text areas for system and user prompts
    - Display available dynamic variables with descriptions
    - Implement field-level validation for empty prompts
    - Add save button with loading state
    - _Requirements: 1.1, 1.2, 1.4, 2.1_

  - [x] 4.3 Implement preview functionality
    - Add preview button and preview display area
    - Show prompts with sample data substituted
    - Visually distinguish template from rendered preview
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]\* 4.4 Write property test for preview substitution
    - **Property 6: Preview Variable Substitution**
    - **Validates: Requirements 4.1**

  - [x] 4.5 Implement reset functionality
    - Add reset button with confirmation dialog
    - Call reset API endpoint on confirmation
    - Update UI with default prompts after reset
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 5. Integrate with OpenAI service
  - [x] 5.1 Update OpenAI service to use prompt config
    - Modify `generateTopicSuggestions` in `lib/services/openai.ts`
    - Fetch custom prompts from prompt config service
    - Apply variable substitution before API call
    - Fall back to defaults if no custom prompts
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
