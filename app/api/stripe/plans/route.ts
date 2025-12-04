import { getActivePlans } from '@/lib/plan-utils';
import { NextResponse } from 'next/server';

/**
 * GET /api/stripe/plans
 * Returns all active subscription plans with their features.
 */
export async function GET() {
  try {
    const plans = await getActivePlans();

    return NextResponse.json({ plans });
  } catch (error: unknown) {
    console.error('Error fetching subscription plans:', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch plans';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
