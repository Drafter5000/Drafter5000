/**
 * AI service for generating AI-powered content suggestions
 * Supports any LLM provider with flexible JSON configuration
 */

import {
  getAIConfig,
  substituteVariablesInObject,
  DEFAULT_AI_CONFIG,
  DEFAULT_ENDPOINTS,
  type PromptVariables,
  type AIConfig,
} from '@/lib/services/prompt-config';

// Legacy endpoints for backward compatibility
const OPENAI_API_URL = DEFAULT_ENDPOINTS.openai;
const ANTHROPIC_API_URL = DEFAULT_ENDPOINTS.anthropic;

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface AnthropicResponse {
  content: {
    type: string;
    text: string;
  }[];
}

/**
 * Extract value from object using dot notation path
 * e.g., 'choices[0].message.content' extracts data.choices[0].message.content
 */
function extractFromPath(obj: unknown, path: string): string {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return '';
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return '';
    }
  }

  return typeof current === 'string' ? current : JSON.stringify(current);
}

/**
 * Generate topic suggestions based on job title and existing topics
 * Uses admin-configurable AI config with dynamic variable substitution
 */
export async function generateTopicSuggestions(
  styleSamples: string[],
  chosenTopics: string[] = [],
  _count: number = 10,
  job?: string,
  generatedTopicsHistory: string[] = []
): Promise<string[]> {
  // Get AI configuration from database
  const aiConfig = await getAIConfig();

  // Build the chosen topics list
  const chosenTopicsText =
    chosenTopics.length > 0 ? chosenTopics.map(t => `- ${t}`).join('\n') : 'None yet';

  // Build the generated topics history
  const generatedTopicsHistoryText =
    generatedTopicsHistory.length > 0
      ? generatedTopicsHistory.map(t => `- ${t}`).join('\n')
      : 'None yet';

  // Combined list for backward compatibility
  const allTopics = [...new Set([...chosenTopics, ...generatedTopicsHistory])];
  const existingTopicsText =
    allTopics.length > 0 ? allTopics.map(t => `- ${t}`).join('\n') : 'None yet';

  const jobTitle = job || 'Entrepreneur';
  const styleSamplesText =
    styleSamples.length > 0 ? styleSamples.join('\n\n') : 'No style samples provided';

  // Prepare variables for substitution
  const variables: PromptVariables = {
    job_title: jobTitle,
    existing_topics: existingTopicsText,
    chosen_topics: chosenTopicsText,
    generated_topics_history: generatedTopicsHistoryText,
    style_samples: styleSamplesText,
  };

  // Substitute variables in the API config
  const processedConfig = substituteVariablesInObject(aiConfig.apiConfig, variables) as Record<
    string,
    unknown
  >;

  let content: string;

  // Check if using new flexible config (has apiEndpoint) or legacy config
  if (aiConfig.apiEndpoint) {
    content = await callFlexibleLLM(aiConfig, processedConfig);
  } else if (aiConfig.provider === 'openai') {
    content = await callOpenAI(processedConfig);
  } else if (aiConfig.provider === 'anthropic') {
    content = await callAnthropic(processedConfig);
  } else {
    // Fallback to OpenAI with default config
    const defaultConfig = substituteVariablesInObject(
      DEFAULT_AI_CONFIG.apiConfig,
      variables
    ) as Record<string, unknown>;
    content = await callOpenAI(defaultConfig);
  }

  // Parse the response - return all suggestions from AI
  return parseTopicSuggestions(content, allTopics);
}

/**
 * Call any LLM API using flexible configuration
 */
async function callFlexibleLLM(
  aiConfig: AIConfig,
  requestBody: Record<string, unknown>
): Promise<string> {
  // Get API key - from config first, then fall back to environment variable
  let apiKey = aiConfig.apiKey;

  if (!apiKey) {
    // Fallback to environment variables based on provider
    const envVarMap: Record<string, string> = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      groq: 'GROQ_API_KEY',
      mistral: 'MISTRAL_API_KEY',
      cohere: 'COHERE_API_KEY',
      together: 'TOGETHER_API_KEY',
      perplexity: 'PERPLEXITY_API_KEY',
      fireworks: 'FIREWORKS_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
    };

    const envVar =
      envVarMap[aiConfig.provider.toLowerCase()] || `${aiConfig.provider.toUpperCase()}_API_KEY`;
    apiKey = process.env[envVar];
  }

  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${aiConfig.provider}`);
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...aiConfig.extraHeaders,
  };

  // Add API key header
  const keyHeader = aiConfig.apiKeyHeader || 'Authorization';
  const keyPrefix = aiConfig.apiKeyPrefix ?? 'Bearer ';
  headers[keyHeader] = `${keyPrefix}${apiKey}`;

  // Special handling for Anthropic
  if (aiConfig.provider === 'anthropic') {
    headers['anthropic-version'] = headers['anthropic-version'] || '2023-06-01';
  }

  const response = await fetch(aiConfig.apiEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`${aiConfig.provider} API error:`, error);
    throw new Error(`Failed to generate suggestions from ${aiConfig.provider}`);
  }

  const data = await response.json();

  // Extract content using response path or auto-detect
  if (aiConfig.responsePath) {
    return extractFromPath(data, aiConfig.responsePath);
  }

  // Auto-detect response format
  // OpenAI-compatible format
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }

  // Anthropic format
  if (data.content?.[0]?.text) {
    return data.content[0].text;
  }

  // Cohere format
  if (data.text) {
    return data.text;
  }

  // Generic fallback
  if (typeof data === 'string') {
    return data;
  }

  console.error('Unable to extract content from response:', data);
  return '[]';
}

/**
 * Call OpenAI API
 */
async function callOpenAI(config: Record<string, unknown>): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate suggestions');
  }

  const data: OpenAIResponse = await response.json();
  return data.choices[0]?.message?.content || '[]';
}

/**
 * Call Anthropic API
 */
async function callAnthropic(config: Record<string, unknown>): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Anthropic API error:', error);
    throw new Error('Failed to generate suggestions');
  }

  const data: AnthropicResponse = await response.json();
  const textContent = data.content.find(c => c.type === 'text');
  return textContent?.text || '[]';
}

/**
 * Parse topic suggestions from AI response
 */
function parseTopicSuggestions(content: string, existingTopics: string[]): string[] {
  try {
    // Clean up markdown code block formatting if present
    let cleanedContent = content.trim();
    cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

    // Parse the JSON array from the response
    const suggestions = JSON.parse(cleanedContent.trim());
    if (Array.isArray(suggestions)) {
      return suggestions.filter(
        (s): s is string =>
          typeof s === 'string' && s.trim().length > 0 && !existingTopics.includes(s)
      );
    }
  } catch {
    // If JSON parsing fails, try to extract topics from text
    const lines = content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => !line.match(/^```|^\[|^\]|^".*",?$/));
    return lines
      .map(line =>
        line
          .replace(/^[\d\-\.\*]+\s*/, '')
          .replace(/^["']|["'],?$/g, '')
          .trim()
      )
      .filter(line => line.length > 0 && !existingTopics.includes(line));
  }

  return [];
}
