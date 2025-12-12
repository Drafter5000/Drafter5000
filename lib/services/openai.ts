/**
 * OpenAI service for generating AI-powered content suggestions
 */

import {
  getPromptConfig,
  substituteVariables,
  type PromptVariables,
} from '@/lib/services/prompt-config';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

/**
 * Generate topic suggestions based on job title and existing topics
 * Uses admin-configurable prompts with dynamic variable substitution
 */
export async function generateTopicSuggestions(
  styleSamples: string[],
  existingTopics: string[] = [],
  count: number = 10,
  job?: string
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Build the existing topics list for the prompt
  const existingTopicsText =
    existingTopics.length > 0 ? existingTopics.map(t => `- ${t}`).join('\n') : 'None yet';

  // Use job title if provided, otherwise default to "LinkedIn content creator"
  const jobTitle = job || 'LinkedIn content creator';

  // Build style samples text
  const styleSamplesText =
    styleSamples.length > 0 ? styleSamples.join('\n\n') : 'No style samples provided';

  // Fetch custom prompts from database (falls back to defaults if not configured)
  const promptConfig = await getPromptConfig();

  // Prepare variables for substitution
  const variables: PromptVariables = {
    job_title: jobTitle,
    existing_topics: existingTopicsText,
    count: count,
    style_samples: styleSamplesText,
  };

  // Apply variable substitution to prompts
  const systemPrompt = substituteVariables(promptConfig.systemPrompt, variables);
  const userPrompt = substituteVariables(promptConfig.userPrompt, variables);

  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate suggestions');
  }

  const data: OpenAIResponse = await response.json();
  const content = data.choices[0]?.message?.content || '[]';

  try {
    // Clean up markdown code block formatting if present
    let cleanedContent = content.trim();

    // Remove markdown code block wrapper (```json ... ``` or ``` ... ```)
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
      // Filter out JSON artifacts and markdown formatting
      .filter(line => !line.match(/^```|^\[|^\]|^".*",?$/));
    return lines
      .map(line =>
        line
          .replace(/^[\d\-\.\*]+\s*/, '')
          .replace(/^["']|["'],?$/g, '')
          .trim()
      )
      .filter(line => line.length > 0 && !existingTopics.includes(line))
      .slice(0, count);
  }

  return [];
}
