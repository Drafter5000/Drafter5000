import { getServerSupabaseUser } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { syncAllUserStats } from '@/lib/services/user-stats-sync';
import { NextResponse } from 'next/server';

/**
 * POST /api/stats/sync-all
 * Sync stats for all users (admin only or cron job)
 */
export async function POST(request: Request) {
  try {
    // Check for cron secret or admin auth
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow cron jobs with secret
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      const result = await syncAllUserStats();
      return NextResponse.json({
        success: true,
        ...result,
        synced_at: new Date().toISOString(),
      });
    }

    // Otherwise require admin auth
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const result = await syncAllUserStats();

    return NextResponse.json({
      success: true,
      ...result,
      synced_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to sync all stats:', error);
    const message = error instanceof Error ? error.message : 'Failed to sync stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
