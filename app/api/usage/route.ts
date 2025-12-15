import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase-client';
import { checkUsageLimit, incrementUsage } from '@/lib/usage-limits';

/**
 * GET /api/usage
 * Get current usage information for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await checkUsageLimit(user.id);

    return NextResponse.json({
      canGenerate: usage.canGenerate,
      articlesUsed: usage.articlesUsed,
      articlesLimit: usage.articlesLimit,
      plan: usage.plan,
      usageResetAt: usage.usageResetAt,
      periodEnd: usage.periodEnd,
    });
  } catch (error: unknown) {
    console.error('Failed to get usage:', error);
    return NextResponse.json({ error: 'Failed to get usage information' }, { status: 500 });
  }
}

/**
 * POST /api/usage/increment
 * Increment usage for the authenticated user.
 * Called after an article is successfully generated.
 */
export async function POST() {
  try {
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await incrementUsage(user.id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Usage limit exceeded',
          articlesUsed: result.articlesUsed,
          articlesLimit: result.articlesLimit,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      articlesUsed: result.articlesUsed,
      articlesLimit: result.articlesLimit,
      canGenerate: result.canGenerate,
    });
  } catch (error: unknown) {
    console.error('Failed to increment usage:', error);
    return NextResponse.json({ error: 'Failed to increment usage' }, { status: 500 });
  }
}
