import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireSuperAdmin } from '@/lib/admin-auth';

interface RouteParams {
  params: Promise<{ id: string; featureId: string }>;
}

/**
 * DELETE /api/admin/plans/[id]/features/[featureId]
 * Removes a feature from a plan.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin();
    const { id, featureId } = await params;

    const supabase = getSupabaseAdmin();

    // Verify feature exists and belongs to the plan
    const { data: feature, error: fetchError } = await supabase
      .from('plan_features')
      .select('id, plan_id')
      .eq('id', featureId)
      .single();

    if (fetchError || !feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    if (feature.plan_id !== id) {
      return NextResponse.json({ error: 'Feature does not belong to this plan' }, { status: 400 });
    }

    // Delete the feature
    const { error } = await supabase.from('plan_features').delete().eq('id', featureId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete feature';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * PATCH /api/admin/plans/[id]/features/[featureId]
 * Updates a feature's text or sort_order.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin();
    const { id, featureId } = await params;

    const body = await request.json();
    const { feature_text, sort_order } = body;

    const supabase = getSupabaseAdmin();

    // Verify feature exists and belongs to the plan
    const { data: feature, error: fetchError } = await supabase
      .from('plan_features')
      .select('id, plan_id')
      .eq('id', featureId)
      .single();

    if (fetchError || !feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    if (feature.plan_id !== id) {
      return NextResponse.json({ error: 'Feature does not belong to this plan' }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (feature_text !== undefined) {
      if (typeof feature_text !== 'string' || feature_text.trim() === '') {
        return NextResponse.json(
          { error: 'feature_text must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.feature_text = feature_text.trim();
    }
    if (sort_order !== undefined) {
      updates.sort_order = sort_order;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updatedFeature, error } = await supabase
      .from('plan_features')
      .update(updates)
      .eq('id', featureId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feature: updatedFeature });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update feature';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
