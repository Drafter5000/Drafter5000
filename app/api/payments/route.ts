import { type NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient, getServerSupabaseSession } from '@/lib/supabase-client';

/**
 * GET /api/payments
 *
 * Fetches payment history for the authenticated user.
 * Returns a list of all payments with details.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch payments for the user
    const {
      data: payments,
      error,
      count,
    } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    return NextResponse.json({
      payments: payments || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: unknown) {
    console.error('Payments fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch payments';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
