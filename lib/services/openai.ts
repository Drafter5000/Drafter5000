/**
 * OpenAI service for generating AI-powered content suggestions
 */

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
 * Generate topic suggestions based on article style samples
 */
export async function generateTopicSuggestions(
  styleSamples: string[],
  existingTopics: string[] = [],
  count: number = 8
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Analyze the style samples to understand the writing style and themes
  const samplesSummary = styleSamples
    .map((sample, i) => `Article ${i + 1}:\n${sample.slice(0, 1500)}...`)
    .join('\n\n');

  const existingTopicsText =
    existingTopics.length > 0
      ? `\n\nThe user has already added these topics (avoid duplicates):\n${existingTopics.map(t => `- ${t}`).join('\n')}`
      : '';

  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are a creative content strategist helping writers discover engaging article topics. 
Analyze the provided writing samples to understand:
1. The author's writing style and tone
2. Their areas of expertise and interest
3. The type of audience they write for
4. Common themes and patterns in their content

Based on this analysis, suggest relevant, engaging article topics that match their style and expertise.
Return ONLY a JSON array of topic strings, nothing else. Each topic should be specific and actionable.`,
    },
    {
      role: 'user',
      content: `Based on these writing samples, suggest ${count} article topic ideas that match this author's style and expertise:

${samplesSummary}${existingTopicsText}

Return only a JSON array of ${count} topic strings.`,
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
    // Parse the JSON array from the response
    const suggestions = JSON.parse(content.trim());
    if (Array.isArray(suggestions)) {
      return suggestions.filter(
        (s): s is string =>
          typeof s === 'string' && s.trim().length > 0 && !existingTopics.includes(s)
      );
    }
  } catch {
    // If JSON parsing fails, try to extract topics from text
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    return lines
      .map(line => line.replace(/^[\d\-\.\*]+\s*/, '').trim())
      .filter(line => line.length > 0 && !existingTopics.includes(line))
      .slice(0, count);
  }

  return [];
}
