import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { getBillingStatus, getPlatformBillingOverview } from '@/lib/services/billing';
import { canAccessBackoffice, hasPlatformAccess, mapToUserRole } from '@/lib/role-config';
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

    // Super Admin can get platform overview or specific org billing
    if (hasPlatformAccess(scopeContext.userRoleType)) {
      if (orgId) {
        const billing = await getBillingStatus(orgId);
        return NextResponse.json({ success: true, billing, type: 'organization' });
      } else {
        const overview = await getPlatformBillingOverview();
        return NextResponse.json({ success: true, overview, type: 'platform' });
      }
    }

    // Customer Admin gets their organization's billing
    if (!scopeContext.currentOrgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const billing = await getBillingStatus(scopeContext.currentOrgId);
    return NextResponse.json({ success: true, billing, type: 'organization' });
  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
