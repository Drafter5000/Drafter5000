/**
 * Prompt Configuration Service
 * Handles storage, retrieval, and variable substitution for AI prompts
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AIConfig {
  provider: string;
  apiConfig: Record<string, unknown>;
}

export interface PromptVariables {
  job_title: string;
  existing_topics: string;
  chosen_topics: string;
  generated_topics_history: string;
  style_samples: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const SUPPORTED_VARIABLES = [
  'job_title',
  'existing_topics',
  'chosen_topics',
  'generated_topics_history',
  'style_samples',
] as const;

export type SupportedVariable = (typeof SUPPORTED_VARIABLES)[number];

// Database keys for app_config table
export const PROMPT_CONFIG_KEYS = {
  AI_CONFIG: 'ai_config',
} as const;

// Default OpenAI configuration
export const DEFAULT_OPENAI_CONFIG = {
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: `You're a LinkedIn topic drafter. Your job is to act as a {{job_title}}, look at the topic ideas already drafted and generate 10 more like it that are different enough to be novel.

Each topic should be:
- Specific and actionable
- Written as a compelling LinkedIn post title
- Different from the existing topics but in a similar professional domain
- Formatted like: "Why [Problem/Observation]—And [Solution/Insight]"

Return ONLY a JSON array of topic strings, nothing else.

Core requirement: Always generate 10 unique, professional LinkedIn post topic ideas. If no existing topics are provided, create fresh topics relevant to the job title "{{job_title}}". Output must be a valid JSON array of strings.`,
    },
    {
      role: 'user',
      content: `Here are the existing topic ideas:
{{existing_topics}}

Generate 10 new topic ideas that are different but related to these themes.

Return only a JSON array of 10 topic strings.

IMPORTANT: You MUST generate exactly 10 topic suggestions as a JSON array. The job title is "{{job_title}}" - generate relevant professional topics for this role. Return ONLY a valid JSON array of strings like: ["Topic 1", "Topic 2", ...]. No markdown, no explanation, no code blocks, just the raw JSON array.`,
    },
  ],
  temperature: 0.8,
  max_tokens: 2000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

// Default Anthropic configuration
export const DEFAULT_ANTHROPIC_CONFIG = {
  model: 'claude-3-5-sonnet-20241022',
  system: `You're a LinkedIn topic drafter. Your job is to act as a {{job_title}}, look at the topic ideas already drafted and generate 10 more like it that are different enough to be novel.

Each topic should be:
- Specific and actionable
- Written as a compelling LinkedIn post title
- Different from the existing topics but in a similar professional domain
- Formatted like: "Why [Problem/Observation]—And [Solution/Insight]"

Return ONLY a JSON array of topic strings, nothing else.

Core requirement: Always generate 10 unique, professional LinkedIn post topic ideas. If no existing topics are provided, create fresh topics relevant to the job title "{{job_title}}". Output must be a valid JSON array of strings.`,
  messages: [
    {
      role: 'user',
      content: `Here are the existing topic ideas:
{{existing_topics}}

Generate 10 new topic ideas that are different but related to these themes.

Return only a JSON array of 10 topic strings.

IMPORTANT: You MUST generate exactly 10 topic suggestions as a JSON array. The job title is "{{job_title}}" - generate relevant professional topics for this role. Return ONLY a valid JSON array of strings like: ["Topic 1", "Topic 2", ...]. No markdown, no explanation, no code blocks, just the raw JSON array.`,
    },
  ],
  max_tokens: 2000,
  temperature: 0.8,
};

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  apiConfig: DEFAULT_OPENAI_CONFIG,
};

// Sample data for preview functionality
export const SAMPLE_VARIABLES: PromptVariables = {
  job_title: 'Senior Product Manager',
  existing_topics:
    '- Why Most Product Roadmaps Fail—And How to Fix Yours\n- The Hidden Cost of Feature Creep—And What Smart PMs Do Instead',
  chosen_topics:
    '- Why Most Product Roadmaps Fail—And How to Fix Yours\n- The Hidden Cost of Feature Creep—And What Smart PMs Do Instead',
  generated_topics_history:
    '- Why Most Product Roadmaps Fail—And How to Fix Yours\n- The Hidden Cost of Feature Creep—And What Smart PMs Do Instead\n- How to Say No to Stakeholders Without Burning Bridges\n- The 3 Metrics Every PM Should Track Daily',
  style_samples: 'Professional, insightful, actionable content style',
};

// Variable descriptions for admin UI
export const VARIABLE_DESCRIPTIONS: Record<SupportedVariable, string> = {
  job_title: "User's job title (e.g., 'Entrepreneur', 'Senior Product Manager')",
  existing_topics:
    'Combined list of all topics (chosen + generated history) - for backward compatibility',
  chosen_topics: 'Topics the user has added to their list (left side in step 2) - topics they love',
  generated_topics_history:
    'All topics previously generated by AI during the session (includes added and ignored)',
  style_samples: "User's writing style samples from step 1",
};

// ============================================================================
// Variable Substitution
// ============================================================================

/**
 * Substitutes dynamic variables in a string with actual values.
 */
export function substituteVariables(template: string, variables: Partial<PromptVariables>): string {
  let result = template;

  for (const varName of SUPPORTED_VARIABLES) {
    const placeholder = `{{${varName}}}`;
    if (varName in variables) {
      const value = variables[varName as keyof PromptVariables];
      const stringValue = value !== undefined && value !== null ? String(value) : '';
      result = result.split(placeholder).join(stringValue);
    }
  }

  return result;
}

/**
 * Recursively substitutes variables in an object (for JSON config)
 */
export function substituteVariablesInObject(
  obj: unknown,
  variables: Partial<PromptVariables>
): unknown {
  if (typeof obj === 'string') {
    return substituteVariables(obj, variables);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => substituteVariablesInObject(item, variables));
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteVariablesInObject(value, variables);
    }
    return result;
  }

  return obj;
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Retrieves AI configuration from the database.
 * Returns default config if no custom config exists.
 */
export async function getAIConfig(): Promise<AIConfig> {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', PROMPT_CONFIG_KEYS.AI_CONFIG)
    .single();

  if (data?.value) {
    try {
      return JSON.parse(data.value);
    } catch {
      return DEFAULT_AI_CONFIG;
    }
  }

  return DEFAULT_AI_CONFIG;
}

/**
 * Saves AI configuration to the database.
 */
export async function saveAIConfig(config: AIConfig): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error } = await supabase.from('app_config').upsert(
    {
      key: PROMPT_CONFIG_KEYS.AI_CONFIG,
      value: JSON.stringify(config),
      description: 'AI configuration for topic generation (provider and API config)',
      updated_at: now,
    },
    { onConflict: 'key' }
  );

  if (error) {
    throw new Error('Failed to save AI configuration');
  }
}

/**
 * Resets AI configuration to default values.
 */
export async function resetAIConfig(): Promise<void> {
  await saveAIConfig(DEFAULT_AI_CONFIG);
}

// ============================================================================
// Legacy Support - Keep old functions for backward compatibility
// ============================================================================

export interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
}

export interface PromptConfigFull extends PromptConfig {
  systemSuffix: string;
  userSuffix: string;
}

/**
 * Legacy function - converts new AI config to old format for backward compatibility
 */
export async function getPromptConfig(): Promise<PromptConfigFull> {
  const aiConfig = await getAIConfig();

  // Extract prompts from the API config based on provider
  if (aiConfig.provider === 'openai') {
    const messages =
      (aiConfig.apiConfig.messages as Array<{ role: string; content: string }>) || [];
    const systemMsg = messages.find(m => m.role === 'system');
    const userMsg = messages.find(m => m.role === 'user');

    return {
      systemPrompt: systemMsg?.content || '',
      userPrompt: userMsg?.content || '',
      systemSuffix: '',
      userSuffix: '',
    };
  }

  if (aiConfig.provider === 'anthropic') {
    const system = (aiConfig.apiConfig.system as string) || '';
    const messages =
      (aiConfig.apiConfig.messages as Array<{ role: string; content: string }>) || [];
    const userMsg = messages.find(m => m.role === 'user');

    return {
      systemPrompt: system,
      userPrompt: userMsg?.content || '',
      systemSuffix: '',
      userSuffix: '',
    };
  }

  // Default fallback
  return {
    systemPrompt: '',
    userPrompt: '',
    systemSuffix: '',
    userSuffix: '',
  };
}
