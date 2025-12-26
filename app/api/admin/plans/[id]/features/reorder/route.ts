import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireSuperAdmin } from '@/lib/admin-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/plans/[id]/features/reorder
 * Reorders features for a plan.
 * Expects body: { feature_ids: string[] } where the array is in the desired order.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const body = await request.json();
    const { feature_ids } = body;

    if (!Array.isArray(feature_ids) || feature_ids.length === 0) {
      return NextResponse.json({ error: 'feature_ids must be a non-empty array' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify plan exists
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('id', id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Verify all features belong to this plan
    const { data: existingFeatures, error: fetchError } = await supabase
      .from('plan_features')
      .select('id')
      .eq('plan_id', id)
      .in('id', feature_ids);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const existingIds = new Set(existingFeatures?.map(f => f.id) || []);
    const invalidIds = feature_ids.filter((fid: string) => !existingIds.has(fid));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Features not found or don't belong to this plan: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Update sort_order for each feature
    const updates = feature_ids.map((featureId: string, index: number) => ({
      id: featureId,
      sort_order: index + 1,
    }));

    // Perform updates in a transaction-like manner
    for (const update of updates) {
      const { error } = await supabase
        .from('plan_features')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Fetch updated features
    const { data: features, error: finalError } = await supabase
      .from('plan_features')
      .select('*')
      .eq('plan_id', id)
      .order('sort_order', { ascending: true });

    if (finalError) {
      return NextResponse.json({ error: finalError.message }, { status: 500 });
    }

    return NextResponse.json({ features: features || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reorder features';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
