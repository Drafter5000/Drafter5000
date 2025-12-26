import { getServerSupabaseUser } from '@/lib/supabase-client';
import { syncUserStats, getUserStats } from '@/lib/services/user-stats-sync';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/stats/sync
 * Get user stats (from cache or fresh sync)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get max age from query params (default 5 minutes)
    const { searchParams } = new URL(request.url);
    const maxAge = parseInt(searchParams.get('max_age') || '5', 10);

    const stats = await getUserStats(user.id, maxAge);

    if (!stats) {
      return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
    }

    return NextResponse.json({
      stats,
      cached: true,
    });
  } catch (error: unknown) {
    console.error('Failed to get stats:', error);
    const message = error instanceof Error ? error.message : 'Failed to get stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/stats/sync
 * Force sync user stats from Google Sheets
 */
export async function POST() {
  try {
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncUserStats(user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
      synced_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to sync stats:', error);
    const message = error instanceof Error ? error.message : 'Failed to sync stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
