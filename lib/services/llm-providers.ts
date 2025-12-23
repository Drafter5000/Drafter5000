/**
 * LLM Provider Service
 * Manages API keys, provider configuration, and model information
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type {
  LLMProvider,
  LLMProviderConfig,
  LLMModel,
  ValidationResult,
} from '@/lib/types/llm-providers';

// ============================================================================
// Provider Configuration
// ============================================================================

export const LLM_PROVIDERS: Record<string, LLMProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiKeyPrefix: 'sk-',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        contextWindow: 128000,
        pricingTier: 'premium',
        inputPricePerMillion: 2.5,
        outputPricePerMillion: 10,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        contextWindow: 128000,
        pricingTier: 'standard',
        inputPricePerMillion: 0.15,
        outputPricePerMillion: 0.6,
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        contextWindow: 128000,
        pricingTier: 'premium',
        inputPricePerMillion: 10,
        outputPricePerMillion: 30,
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        contextWindow: 16385,
        pricingTier: 'standard',
        inputPricePerMillion: 0.5,
        outputPricePerMillion: 1.5,
      },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    apiKeyPrefix: 'sk-ant-',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        pricingTier: 'premium',
        inputPricePerMillion: 3,
        outputPricePerMillion: 15,
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        contextWindow: 200000,
        pricingTier: 'standard',
        inputPricePerMillion: 0.8,
        outputPricePerMillion: 4,
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        contextWindow: 200000,
        pricingTier: 'premium',
        inputPricePerMillion: 15,
        outputPricePerMillion: 75,
      },
    ],
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    apiKeyPrefix: 'xai-',
    apiEndpoint: 'https://api.x.ai/v1/chat/completions',
    models: [
      {
        id: 'grok-beta',
        name: 'Grok Beta',
        contextWindow: 131072,
        pricingTier: 'premium',
        inputPricePerMillion: 5,
        outputPricePerMillion: 15,
      },
    ],
  },
  google: {
    id: 'google',
    name: 'Google AI',
    apiKeyPrefix: 'AI',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        contextWindow: 2097152,
        pricingTier: 'premium',
        inputPricePerMillion: 1.25,
        outputPricePerMillion: 5,
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        contextWindow: 1048576,
        pricingTier: 'standard',
        inputPricePerMillion: 0.075,
        outputPricePerMillion: 0.3,
      },
    ],
  },
};

// Database keys for API keys
const API_KEY_PREFIX = 'llm_api_key_';

// ============================================================================
// API Key Validation
// ============================================================================

/**
 * Validates API key format for a specific provider
 */
export function validateApiKeyFormat(providerId: string, apiKey: string): ValidationResult {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  const provider = LLM_PROVIDERS[providerId];
  if (!provider) {
    return { valid: false, error: `Unknown provider: ${providerId}` };
  }

  // Check minimum length
  if (apiKey.length < 10) {
    return { valid: false, error: 'API key is too short' };
  }

  // Check prefix for providers that have specific prefixes
  if (provider.apiKeyPrefix && !apiKey.startsWith(provider.apiKeyPrefix)) {
    return {
      valid: false,
      error: `${provider.name} API keys should start with "${provider.apiKeyPrefix}"`,
    };
  }

  return { valid: true };
}

// ============================================================================
// API Key Masking
// ============================================================================

/**
 * Masks an API key, showing only the last 4 characters with a fixed-length mask
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 4) {
    return '••••';
  }
  const visiblePart = apiKey.slice(-4);
  // Use fixed 8 dots instead of full length to prevent overflow
  return '••••••••' + visiblePart;
}

// ============================================================================
// API Key Storage
// ============================================================================

/**
 * Saves an API key for a provider (stored in app_config)
 */
export async function saveApiKey(providerId: string, apiKey: string): Promise<void> {
  const validation = validateApiKeyFormat(providerId, apiKey);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const supabase = getSupabaseAdmin();
  const key = `${API_KEY_PREFIX}${providerId}`;
  const now = new Date().toISOString();

  const { error } = await supabase.from('app_config').upsert(
    {
      key,
      value: apiKey,
      description: `API key for ${LLM_PROVIDERS[providerId]?.name || providerId}`,
      updated_at: now,
    },
    { onConflict: 'key' }
  );

  if (error) {
    throw new Error(`Failed to save API key: ${error.message}`);
  }
}

/**
 * Retrieves an API key for a provider
 */
export async function getApiKey(providerId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const key = `${API_KEY_PREFIX}${providerId}`;

  const { data, error } = await supabase.from('app_config').select('value').eq('key', key).single();

  if (error || !data) {
    return null;
  }

  return data.value;
}

/**
 * Deletes an API key for a provider
 */
export async function deleteApiKey(providerId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const key = `${API_KEY_PREFIX}${providerId}`;

  const { error } = await supabase.from('app_config').delete().eq('key', key);

  if (error) {
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

// ============================================================================
// Provider Information
// ============================================================================

/**
 * Gets all providers with their configuration status
 */
export async function getProviders(): Promise<LLMProvider[]> {
  const supabase = getSupabaseAdmin();

  // Fetch all API keys at once
  const { data: configs } = await supabase
    .from('app_config')
    .select('key, value')
    .like('key', `${API_KEY_PREFIX}%`);

  const apiKeys: Record<string, string> = {};
  if (configs) {
    for (const config of configs) {
      const providerId = config.key.replace(API_KEY_PREFIX, '');
      apiKeys[providerId] = config.value;
    }
  }

  // Build provider list
  return Object.values(LLM_PROVIDERS).map(provider => ({
    id: provider.id,
    name: provider.name,
    models: provider.models,
    apiKeyConfigured: !!apiKeys[provider.id],
    maskedApiKey: apiKeys[provider.id] ? maskApiKey(apiKeys[provider.id]) : undefined,
  }));
}

/**
 * Gets models for a specific provider
 */
export function getModelsForProvider(providerId: string): LLMModel[] {
  const provider = LLM_PROVIDERS[providerId];
  return provider?.models || [];
}

/**
 * Gets provider configuration by ID
 */
export function getProviderConfig(providerId: string): LLMProviderConfig | undefined {
  return LLM_PROVIDERS[providerId];
}
