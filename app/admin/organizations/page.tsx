'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OrgTable } from '@/components/admin/org-table';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import type { AdminOrgView, PaginatedResult, AdminSession } from '@/lib/types';
import { UserRoleType } from '@/lib/types';
import { hasPlatformAccess, mapToUserRole } from '@/lib/role-config';

export default function AdminOrganizationsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [data, setData] = useState<PaginatedResult<AdminOrgView>>({
    data: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOrganizations = useCallback(async (page: number, searchQuery: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
      });
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/organizations?${params}`);
      if (!res.ok) throw new Error('Failed to fetch organizations');
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check session and access
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/auth/session');
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setSessionLoading(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (session) {
      fetchOrganizations(1, '');
    }
  }, [fetchOrganizations, session]);

  const handleSearch = (query: string) => {
    setSearch(query);
    fetchOrganizations(1, query);
  };

  const handlePageChange = (page: number) => {
    fetchOrganizations(page, search);
  };

  const handleEdit = (orgId: string) => {
    router.push(`/admin/organizations/${orgId}`);
  };

  const handleDeactivate = async (orgId: string) => {
    if (!confirm('Are you sure you want to deactivate this organization?')) return;

    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate' }),
      });

      if (!res.ok) throw new Error('Failed to deactivate organization');
      fetchOrganizations(data.page, search);
    } catch (error) {
      console.error('Error deactivating organization:', error);
    }
  };

  // Check if user has platform access (Super Admin only)
  const userRoleType = session
    ? mapToUserRole(session.role, session.is_super_admin)
    : UserRoleType.CUSTOMER;
  const isPlatformAdmin = hasPlatformAccess(userRoleType);

  // Show loading while checking session
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied for non-Super Admins
  if (!isPlatformAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">Only Super Admins can view all organizations.</p>
        <Button onClick={() => router.push('/admin')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">Manage all organizations in the system</p>
        </div>
        {/* <Link href="/admin/organizations/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Organization
          </Button>
        </Link> */}
      </div>

      <OrgTable
        data={data}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        loading={loading}
      />
    </div>
  );
}
