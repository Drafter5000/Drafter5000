import { getServerSupabaseSession } from '@/lib/supabase-client';
import { checkUsageLimit, syncUsageFromSheets } from '@/lib/usage-limits';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sync usage from Google Sheets first (count "Sent" articles, case-insensitive)
    // This ensures the database reflects the actual sent articles in the sheet
    await syncUsageFromSheets(session.user.id);

    // Get usage from database (now synced with sheets)
    const usage = await checkUsageLimit(session.user.id);

    return NextResponse.json({
      plan: usage.plan,
      articles_used: usage.articlesUsed,
      articles_limit: usage.articlesLimit,
      percentage_used:
        usage.articlesLimit > 0 ? Math.round((usage.articlesUsed / usage.articlesLimit) * 100) : 0,
      can_generate: usage.canGenerate,
      usage_reset_at: usage.usageResetAt,
      period_end: usage.periodEnd,
    });
  } catch (error: unknown) {
    console.error('Usage fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch usage';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
