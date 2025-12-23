/**
 * Type definitions for LLM providers, models, and playground usage
 */

export type PricingTier = 'free' | 'standard' | 'premium';

export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  pricingTier: PricingTier;
  inputPricePerMillion?: number;
  outputPricePerMillion?: number;
}

export interface LLMProviderConfig {
  id: string;
  name: string;
  models: LLMModel[];
  apiKeyPrefix: string;
  apiEndpoint: string;
}

export interface LLMProvider {
  id: string;
  name: string;
  models: LLMModel[];
  apiKeyConfigured: boolean;
  maskedApiKey?: string;
}

export interface PlaygroundRequest {
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PlaygroundResponse {
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

export interface PlaygroundError {
  error: string;
  code?: string;
  retryable: boolean;
}

export interface UsageRecord {
  id: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  responseTimeMs?: number;
  createdAt: Date;
}

export interface UsageStats {
  provider: string;
  period: 'day' | 'week' | 'month';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
