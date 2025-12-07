import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { getUsageMetrics, getPlatformUsageMetrics } from '@/lib/services/usage';
import { canAccessBackoffice, hasPlatformAccess } from '@/lib/role-config';
import { createOrgScopeContext } from '@/lib/services/org-scope';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scopeContext = await createOrgScopeContext(session);

    if (!canAccessBackoffice(scopeContext.userRoleType)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id');

    // Super Admin can get platform metrics or specific org usage
    if (hasPlatformAccess(scopeContext.userRoleType)) {
      if (orgId) {
        const usage = await getUsageMetrics(orgId);
        return NextResponse.json({ success: true, usage, type: 'organization' });
      } else {
        const metrics = await getPlatformUsageMetrics();
        return NextResponse.json({ success: true, metrics, type: 'platform' });
      }
    }

    // Customer Admin gets their organization's usage
    if (!scopeContext.currentOrgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const usage = await getUsageMetrics(scopeContext.currentOrgId);
    return NextResponse.json({ success: true, usage, type: 'organization' });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
