import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import {
  getUsageStats,
  getUsageHistory,
  getTotalUsageSummary,
} from '@/lib/services/playground-usage';

/**
 * GET /api/admin/playground/usage
 * Returns usage statistics and history for the playground
 */
export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [stats, history, summary] = await Promise.all([
      getUsageStats(),
      getUsageHistory(50),
      getTotalUsageSummary(),
    ]);

    return NextResponse.json({
      stats,
      history,
      summary,
    });
  } catch (error: unknown) {
    console.error('Error fetching playground usage:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch usage';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
