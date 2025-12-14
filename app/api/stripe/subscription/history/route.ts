import { getServerSupabaseSession, getServerSupabaseClient } from '@/lib/supabase-client';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET - Fetch subscription history for the current user
 * Returns all past subscription periods and events
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getServerSupabaseClient();

    // Get subscription history ordered by most recent first
    const { data: history, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch subscription history:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    return NextResponse.json({
      history: history || [],
      total: history?.length || 0,
    });
  } catch (error: unknown) {
    console.error('Subscription history fetch error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
