/**
 * AI service for generating AI-powered content suggestions
 * Supports OpenAI and Anthropic providers
 */

import {
  getAIConfig,
  substituteVariablesInObject,
  DEFAULT_AI_CONFIG,
  type PromptVariables,
} from '@/lib/services/prompt-config';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

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

  if (aiConfig.provider === 'openai') {
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
