import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireSuperAdmin } from '@/lib/admin-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/plans/[id]/features
 * Returns all features for a specific plan.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

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

    const { data: features, error } = await supabase
      .from('plan_features')
      .select('*')
      .eq('plan_id', id)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ features: features || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch features';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * POST /api/admin/plans/[id]/features
 * Adds a new feature to a plan.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const body = await request.json();
    const { feature_text, sort_order } = body;

    if (!feature_text || typeof feature_text !== 'string' || feature_text.trim() === '') {
      return NextResponse.json(
        { error: 'feature_text is required and must be a non-empty string' },
        { status: 400 }
      );
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

    // Get max sort_order if not provided
    let finalSortOrder = sort_order;
    if (finalSortOrder === undefined) {
      const { data: maxFeature } = await supabase
        .from('plan_features')
        .select('sort_order')
        .eq('plan_id', id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      finalSortOrder = (maxFeature?.sort_order || 0) + 1;
    }

    const { data: feature, error } = await supabase
      .from('plan_features')
      .insert({
        plan_id: id,
        feature_text: feature_text.trim(),
        sort_order: finalSortOrder,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feature }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add feature';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
