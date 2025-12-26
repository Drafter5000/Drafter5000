import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { getDashboardMetrics } from '@/lib/services/admin-metrics';

export async function GET() {
  try {
    // Verify admin access
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await getDashboardMetrics();

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
