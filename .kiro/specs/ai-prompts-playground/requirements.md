# Requirements Document

## Introduction

This feature extends the existing Admin AI Prompts page to include a comprehensive AI Playground that allows administrators to test prompts with multiple LLM providers (OpenAI/ChatGPT, Anthropic/Claude, xAI/Grok, Google/Gemini). The playground enables API key management, model selection, prompt testing, and token usage tracking—all within a secure admin interface.

## Glossary

- **LLM Provider**: A company offering Large Language Model API services (e.g., OpenAI, Anthropic, xAI, Google)
- **API Key**: A secret credential used to authenticate requests to an LLM provider's API
- **Model**: A specific AI model version offered by a provider (e.g., gpt-4o-mini, claude-3-sonnet)
- **Token**: The basic unit of text processing in LLMs; used for billing and rate limiting
- **Playground**: An interactive interface for testing prompts against different LLM models
- **Admin Panel**: The administrative interface accessible only to authenticated admin users
- **Prompt Config**: The system and user prompts used for AI-powered topic generation

## Requirements

### Requirement 1

**User Story:** As an admin, I want to configure API keys for multiple LLM providers, so that I can test prompts with different AI services.

#### Acceptance Criteria

1. WHEN an admin navigates to the AI Prompts page THEN the System SHALL display an API Keys configuration section with fields for OpenAI, Anthropic, xAI, and Google API keys
2. WHEN an admin enters an API key and saves THEN the System SHALL encrypt and store the API key securely in the database
3. WHEN an admin views a saved API key THEN the System SHALL display only the last 4 characters with the rest masked
4. WHEN an admin deletes an API key THEN the System SHALL remove the key from the database and disable that provider in the playground
5. IF an admin enters an invalid API key format THEN the System SHALL display a validation error and prevent saving

### Requirement 2

**User Story:** As an admin, I want to select from available models for each configured provider, so that I can test prompts with specific model versions.

#### Acceptance Criteria

1. WHEN an admin has configured an API key for a provider THEN the System SHALL enable model selection for that provider
2. WHEN an admin selects a provider in the playground THEN the System SHALL display a dropdown with available models for that provider
3. WHEN no API key is configured for a provider THEN the System SHALL disable that provider option and display a message to configure the API key first
4. WHEN the System displays model options THEN the System SHALL show model name, context window size, and pricing tier information

### Requirement 3

**User Story:** As an admin, I want to test prompts in an interactive playground, so that I can evaluate AI responses before deploying prompt changes.

#### Acceptance Criteria

1. WHEN an admin opens the playground tab THEN the System SHALL display input fields for system prompt, user prompt, provider selection, and model selection
2. WHEN an admin clicks the "Run" button with valid inputs THEN the System SHALL send the prompts to the selected LLM and display the response
3. WHEN the System receives a response THEN the System SHALL display the response text, response time, and token usage (input/output/total)
4. WHILE a request is in progress THEN the System SHALL display a loading indicator and disable the Run button
5. IF the LLM request fails THEN the System SHALL display an error message with details and allow retry
6. WHEN an admin wants to use current prompt config THEN the System SHALL provide a button to load the saved system and user prompts into the playground

### Requirement 4

**User Story:** As an admin, I want to track token usage across playground sessions, so that I can monitor API costs and usage patterns.

#### Acceptance Criteria

1. WHEN an admin runs a playground request THEN the System SHALL record the token usage with timestamp, provider, model, and token counts
2. WHEN an admin views the usage section THEN the System SHALL display total tokens used per provider for the current day, week, and month
3. WHEN displaying usage statistics THEN the System SHALL show input tokens, output tokens, and total tokens separately
4. WHEN an admin views usage history THEN the System SHALL display a table of recent playground requests with provider, model, tokens, and timestamp

### Requirement 5

**User Story:** As an admin, I want the playground to pre-populate with sample variables, so that I can quickly test prompts with realistic data.

#### Acceptance Criteria

1. WHEN an admin opens the playground THEN the System SHALL display the current sample variables used for preview
2. WHEN an admin modifies sample variables THEN the System SHALL use the modified values for variable substitution in prompts
3. WHEN an admin clicks "Reset Variables" THEN the System SHALL restore the default sample variable values
