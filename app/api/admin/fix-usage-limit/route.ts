/**
 * Admin endpoint to manually fix a user's usage limit
 * This is a temporary fix for users who upgraded but didn't get their limit increased
 *
 * POST /api/admin/fix-usage-limit
 * Body: { user_id: string, additional_articles: number }
 */

import { getServerSupabaseSession } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, allow any authenticated user to fix their own limit
    // In production, you'd want to restrict this to admins only
    const body = await request.json();
    const { user_id, additional_articles } = body;

    // Only allow users to fix their own limit (or add admin check here)
    const targetUserId = user_id || session.user.id;
    if (targetUserId !== session.user.id) {
      // Add admin check here if needed
      // For now, only allow self-fix
      return NextResponse.json({ error: 'Can only fix your own limit' }, { status: 403 });
    }

    const additionalLimit = additional_articles || 30; // Default to 30 (one month's worth)

    const supabase = getSupabaseAdmin();

    // Get current subscription
    const { data: currentSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('articles_used, articles_limit')
      .eq('user_id', targetUserId)
      .single();

    if (fetchError || !currentSub) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const oldLimit = currentSub.articles_limit || 0;
    const newLimit = oldLimit + additionalLimit;

    // Update the limit
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        articles_limit: newLimit,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', targetUserId);

    if (updateError) {
      console.error('Failed to update limit:', updateError);
      return NextResponse.json({ error: 'Failed to update limit' }, { status: 500 });
    }

    console.log(
      `[Admin] Fixed usage limit for user ${targetUserId}: ${oldLimit} -> ${newLimit} (+${additionalLimit})`
    );

    return NextResponse.json({
      success: true,
      user_id: targetUserId,
      old_limit: oldLimit,
      new_limit: newLimit,
      added: additionalLimit,
      articles_used: currentSub.articles_used,
      can_generate: currentSub.articles_used < newLimit,
    });
  } catch (error: unknown) {
    console.error('Fix usage limit error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fix usage limit';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
