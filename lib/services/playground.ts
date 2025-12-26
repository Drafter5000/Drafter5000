/**
 * Playground Service
 * Handles prompt execution across different LLM providers
 */

import { getApiKey, getProviderConfig, LLM_PROVIDERS } from '@/lib/services/llm-providers';
import type {
  PlaygroundRequest,
  PlaygroundResponse,
  PlaygroundError,
} from '@/lib/types/llm-providers';

// ============================
// Provider-specific API calls
// ============================

interface OpenAIResponse {
  choices: { message: { content: string } }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AnthropicResponse {
  content: { type: string; text: string }[];
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface GoogleResponse {
  candidates: { content: { parts: { text: string }[] } }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data: OpenAIResponse = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    inputTokens: data.usage.prompt_tokens,
    outputTokens: data.usage.completion_tokens,
  };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data: AnthropicResponse = await response.json();
  const textContent = data.content.find(c => c.type === 'text');
  return {
    content: textContent?.text || '',
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
  };
}

async function callXAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  // xAI uses OpenAI-compatible API
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`xAI API error: ${error}`);
  }

  const data: OpenAIResponse = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    inputTokens: data.usage.prompt_tokens,
    outputTokens: data.usage.completion_tokens,
  };
}

async function callGoogle(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI API error: ${error}`);
  }

  const data: GoogleResponse = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return {
    content,
    inputTokens: data.usageMetadata?.promptTokenCount || 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
  };
}

// ============================================================================
// Main Playground Execution
// ============================================================================

/**
 * Executes a playground request against the specified LLM provider
 */
export async function executePlayground(
  request: PlaygroundRequest
): Promise<PlaygroundResponse | PlaygroundError> {
  const {
    provider,
    model,
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxTokens = 1000,
  } = request;

  // Validate provider
  const providerConfig = getProviderConfig(provider);
  if (!providerConfig) {
    return {
      error: `Unknown provider: ${provider}`,
      retryable: false,
    };
  }

  // Get API key
  const apiKey = await getApiKey(provider);
  if (!apiKey) {
    return {
      error: `No API key configured for ${providerConfig.name}. Please add an API key first.`,
      code: 'NO_API_KEY',
      retryable: false,
    };
  }

  // Validate model
  const validModel = providerConfig.models.find(m => m.id === model);
  if (!validModel) {
    return {
      error: `Invalid model "${model}" for provider ${providerConfig.name}`,
      retryable: false,
    };
  }

  const startTime = Date.now();

  try {
    let result: { content: string; inputTokens: number; outputTokens: number };

    switch (provider) {
      case 'openai':
        result = await callOpenAI(apiKey, model, systemPrompt, userPrompt, temperature, maxTokens);
        break;
      case 'anthropic':
        result = await callAnthropic(
          apiKey,
          model,
          systemPrompt,
          userPrompt,
          temperature,
          maxTokens
        );
        break;
      case 'xai':
        result = await callXAI(apiKey, model, systemPrompt, userPrompt, temperature, maxTokens);
        break;
      case 'google':
        result = await callGoogle(apiKey, model, systemPrompt, userPrompt, temperature, maxTokens);
        break;
      default:
        return {
          error: `Provider ${provider} is not supported`,
          retryable: false,
        };
    }

    const responseTimeMs = Date.now() - startTime;

    return {
      content: result.content,
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.inputTokens + result.outputTokens,
      },
      responseTimeMs,
      model,
      provider,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Determine if error is retryable
    const retryable =
      errorMessage.includes('timeout') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('503') ||
      errorMessage.includes('429');

    return {
      error: errorMessage,
      code: retryable ? 'RETRYABLE' : 'FATAL',
      retryable,
    };
  }
}

/**
 * Type guard to check if response is an error
 */
export function isPlaygroundError(
  response: PlaygroundResponse | PlaygroundError
): response is PlaygroundError {
  return 'error' in response;
}
