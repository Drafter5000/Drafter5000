# Design Document: AI Prompts Playground

## Overview

This feature extends the existing Admin AI Prompts page to include a multi-provider AI Playground. The playground allows administrators to configure API keys for multiple LLM providers (OpenAI, Anthropic, xAI, Google), select specific models, test prompts interactively, and track token usage. The implementation builds on the existing prompt configuration system while adding new capabilities for provider management and usage tracking.

## Architecture

```mermaid
graph TB
    subgraph "Admin UI"
        A[AI Prompts Page] --> B[API Keys Tab]
        A --> C[Prompt Config Tab]
        A --> D[Playground Tab]
        A --> E[Usage Tab]
    end

    subgraph "API Layer"
        F[/api/admin/prompts] --> G[Prompt Config Service]
        H[/api/admin/llm-providers] --> I[LLM Provider Service]
        J[/api/admin/playground] --> K[Playground Service]
        L[/api/admin/playground/usage] --> M[Usage Service]
    end

    subgraph "External APIs"
        K --> N[OpenAI API]
        K --> O[Anthropic API]
        K --> P[xAI API]
        K --> Q[Google AI API]
    end

    subgraph "Database"
        I --> R[(app_config)]
        M --> S[(playground_usage)]
    end
```

## Components and Interfaces

### 1. LLM Provider Service (`lib/services/llm-providers.ts`)

Manages API key storage, encryption, and provider configuration.

```typescript
interface LLMProvider {
  id: string;
  name: string;
  models: LLMModel[];
  apiKeyConfigured: boolean;
  maskedApiKey?: string;
}

interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  pricingTier: 'free' | 'standard' | 'premium';
  inputPricePerMillion?: number;
  outputPricePerMillion?: number;
}

// Functions
function getProviders(): Promise<LLMProvider[]>;
function saveApiKey(providerId: string, apiKey: string): Promise<void>;
function deleteApiKey(providerId: string): Promise<void>;
function getApiKey(providerId: string): Promise<string | null>;
function maskApiKey(apiKey: string): string;
function validateApiKeyFormat(providerId: string, apiKey: string): ValidationResult;
```

### 2. Playground Service (`lib/services/playground.ts`)

Handles prompt execution across different LLM providers.

```typescript
interface PlaygroundRequest {
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface PlaygroundResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  responseTimeMs: number;
  model: string;
  provider: string;
}

// Functions
function executePlayground(request: PlaygroundRequest): Promise<PlaygroundResponse>;
function recordUsage(response: PlaygroundResponse): Promise<void>;
```

### 3. Usage Service (`lib/services/playground-usage.ts`)

Tracks and aggregates token usage statistics.

```typescript
interface UsageRecord {
  id: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  createdAt: Date;
}

interface UsageStats {
  provider: string;
  period: 'day' | 'week' | 'month';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// Functions
function getUsageStats(): Promise<UsageStats[]>;
function getUsageHistory(limit?: number): Promise<UsageRecord[]>;
```

### 4. API Routes

| Route                         | Method | Description                                  |
| ----------------------------- | ------ | -------------------------------------------- |
| `/api/admin/llm-providers`    | GET    | List all providers with configuration status |
| `/api/admin/llm-providers`    | POST   | Save or delete API key                       |
| `/api/admin/playground`       | POST   | Execute playground request                   |
| `/api/admin/playground/usage` | GET    | Get usage statistics and history             |

### 5. UI Components

- `AdminPromptsPage` - Extended with tabs for different sections
- `ApiKeysSection` - API key management for each provider
- `PlaygroundSection` - Interactive prompt testing interface
- `UsageSection` - Token usage statistics and history

## Data Models

### Database Schema Addition

```sql
-- Playground usage tracking table
CREATE TABLE IF NOT EXISTS playground_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playground_usage_provider ON playground_usage(provider);
CREATE INDEX idx_playground_usage_created_at ON playground_usage(created_at);
```

### App Config Keys for API Keys

API keys are stored encrypted in the `app_config` table:

- `llm_api_key_openai` - OpenAI API key (encrypted)
- `llm_api_key_anthropic` - Anthropic API key (encrypted)
- `llm_api_key_xai` - xAI API key (encrypted)
- `llm_api_key_google` - Google AI API key (encrypted)

### Provider and Model Configuration

```typescript
const LLM_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, pricingTier: 'premium' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, pricingTier: 'standard' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, pricingTier: 'premium' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, pricingTier: 'standard' },
    ],
    apiKeyPrefix: 'sk-',
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        pricingTier: 'premium',
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        contextWindow: 200000,
        pricingTier: 'standard',
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        contextWindow: 200000,
        pricingTier: 'premium',
      },
    ],
    apiKeyPrefix: 'sk-ant-',
  },
  xai: {
    name: 'xAI',
    models: [{ id: 'grok-beta', name: 'Grok Beta', contextWindow: 131072, pricingTier: 'premium' }],
    apiKeyPrefix: 'xai-',
  },
  google: {
    name: 'Google AI',
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        contextWindow: 2097152,
        pricingTier: 'premium',
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        contextWindow: 1048576,
        pricingTier: 'standard',
      },
    ],
    apiKeyPrefix: 'AI',
  },
};
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: API Key Encryption Round-Trip

_For any_ valid API key string, encrypting and then decrypting the key should produce the original API key value.
**Validates: Requirements 1.2**

### Property 2: API Key Masking Format

_For any_ API key string of length >= 4, the masked version should have length equal to the original, show only the last 4 characters, and mask all preceding characters with asterisks.
**Validates: Requirements 1.3**

### Property 3: API Key Deletion Removes Data

_For any_ provider with a saved API key, after deletion, retrieving the API key for that provider should return null.
**Validates: Requirements 1.4**

### Property 4: Invalid API Key Rejection

_For any_ string that does not match the expected API key format for a provider, validation should return an error.
**Validates: Requirements 1.5**

### Property 5: Provider Enablement Based on API Key

_For any_ provider, the provider should be enabled for model selection if and only if an API key is configured for that provider.
**Validates: Requirements 2.1, 2.3**

### Property 6: Provider Returns Correct Models

_For any_ provider ID, the returned model list should contain only models belonging to that provider and include all required metadata (name, contextWindow, pricingTier).
**Validates: Requirements 2.2, 2.4**

### Property 7: Playground Response Contains Required Metrics

_For any_ successful playground response, the response object should contain content, inputTokens, outputTokens, totalTokens, and responseTimeMs fields, where totalTokens equals inputTokens + outputTokens.
**Validates: Requirements 3.3**

### Property 8: Error Responses Contain Error Details

_For any_ failed playground request, the error response should contain an error message and allow retry.
**Validates: Requirements 3.5**

### Property 9: Load Config Populates Playground

_For any_ saved prompt configuration, loading it into the playground should result in the playground fields matching the saved values.
**Validates: Requirements 3.6**

### Property 10: Usage Recording Captures All Fields

_For any_ playground request, the recorded usage entry should contain provider, model, inputTokens, outputTokens, totalTokens, and timestamp.
**Validates: Requirements 4.1**

### Property 11: Usage Aggregation Correctness

_For any_ set of usage records, the aggregated totals for each period (day/week/month) should equal the sum of individual records within that period, with input + output = total for each aggregation.
**Validates: Requirements 4.2, 4.3, 4.4**

### Property 12: Variable Substitution Applies Modified Values

_For any_ prompt template and modified variable values, the substituted prompt should contain the modified values in place of the variable placeholders.
**Validates: Requirements 5.2**

### Property 13: Reset Variables Restores Defaults

_For any_ modified sample variables state, after reset, the variables should exactly match the default sample variable values.
**Validates: Requirements 5.3**

## Error Handling

| Error Scenario                 | Handling Strategy                         |
| ------------------------------ | ----------------------------------------- |
| Invalid API key format         | Display validation error, prevent save    |
| API key authentication failure | Display provider-specific error message   |
| LLM request timeout            | Show timeout error with retry option      |
| Rate limiting                  | Display rate limit message with wait time |
| Network errors                 | Show connection error with retry option   |
| Invalid model selection        | Disable run button, show model error      |

## Testing Strategy

### Property-Based Testing

The implementation will use **fast-check** as the property-based testing library for TypeScript/JavaScript.

Each property-based test will:

- Run a minimum of 100 iterations
- Be tagged with a comment referencing the correctness property
- Use format: `**Feature: ai-prompts-playground, Property {number}: {property_text}**`

### Unit Tests

Unit tests will cover:

- API key encryption/decryption functions
- API key masking function
- API key format validation per provider
- Usage aggregation calculations
- Variable substitution logic

### Integration Tests

Integration tests will verify:

- API routes return correct responses
- Database operations work correctly
- Provider API calls are properly formatted
