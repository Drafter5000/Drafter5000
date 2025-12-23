/**
 * Playground Usage Service
 * Tracks and aggregates token usage statistics for AI playground
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { PlaygroundResponse, UsageRecord, UsageStats } from '@/lib/types/llm-providers';

// ============================================================================
// Usage Recording
// ============================================================================

/**
 * Records usage from a playground response
 */
export async function recordUsage(response: PlaygroundResponse): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('playground_usage').insert({
    provider: response.provider,
    model: response.model,
    input_tokens: response.usage.inputTokens,
    output_tokens: response.usage.outputTokens,
    total_tokens: response.usage.totalTokens,
    response_time_ms: response.responseTimeMs,
  });

  if (error) {
    console.error('Failed to record playground usage:', error);
    // Don't throw - usage recording failure shouldn't break the playground
  }
}

// ============================================================================
// Usage Statistics
// ============================================================================

type Period = 'day' | 'week' | 'month';

function getPeriodStart(period: Period): Date {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek;
      return new Date(now.getFullYear(), now.getMonth(), diff);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

/**
 * Gets aggregated usage statistics by provider and period
 */
export async function getUsageStats(): Promise<UsageStats[]> {
  const supabase = getSupabaseAdmin();
  const periods: Period[] = ['day', 'week', 'month'];
  const stats: UsageStats[] = [];

  for (const period of periods) {
    const periodStart = getPeriodStart(period);

    const { data, error } = await supabase
      .from('playground_usage')
      .select('provider, input_tokens, output_tokens, total_tokens')
      .gte('created_at', periodStart.toISOString());

    if (error) {
      console.error(`Failed to fetch usage stats for ${period}:`, error);
      continue;
    }

    // Aggregate by provider
    const providerTotals: Record<
      string,
      { inputTokens: number; outputTokens: number; totalTokens: number }
    > = {};

    for (const record of data || []) {
      if (!providerTotals[record.provider]) {
        providerTotals[record.provider] = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      }
      providerTotals[record.provider].inputTokens += record.input_tokens;
      providerTotals[record.provider].outputTokens += record.output_tokens;
      providerTotals[record.provider].totalTokens += record.total_tokens;
    }

    // Convert to stats array
    for (const [provider, totals] of Object.entries(providerTotals)) {
      stats.push({
        provider,
        period,
        inputTokens: totals.inputTokens,
        outputTokens: totals.outputTokens,
        totalTokens: totals.totalTokens,
      });
    }
  }

  return stats;
}

/**
 * Gets recent usage history
 */
export async function getUsageHistory(limit: number = 50): Promise<UsageRecord[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('playground_usage')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch usage history:', error);
    return [];
  }

  return (data || []).map(record => ({
    id: record.id,
    provider: record.provider,
    model: record.model,
    inputTokens: record.input_tokens,
    outputTokens: record.output_tokens,
    totalTokens: record.total_tokens,
    responseTimeMs: record.response_time_ms,
    createdAt: new Date(record.created_at),
  }));
}

/**
 * Gets total usage summary across all providers
 */
export async function getTotalUsageSummary(): Promise<{
  totalRequests: number;
  totalTokens: number;
  avgResponseTime: number;
}> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('playground_usage')
    .select('total_tokens, response_time_ms');

  if (error || !data) {
    return { totalRequests: 0, totalTokens: 0, avgResponseTime: 0 };
  }

  const totalRequests = data.length;
  const totalTokens = data.reduce((sum, r) => sum + r.total_tokens, 0);
  const avgResponseTime =
    totalRequests > 0
      ? Math.round(data.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / totalRequests)
      : 0;

  return { totalRequests, totalTokens, avgResponseTime };
}
