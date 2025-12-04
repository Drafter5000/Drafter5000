'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OrgTable } from '@/components/admin/org-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { AdminOrgView, PaginatedResult } from '@/lib/types';

export default function AdminOrganizationsPage() {
  const router = useRouter();
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

  useEffect(() => {
    fetchOrganizations(1, '');
  }, [fetchOrganizations]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">Manage all organizations in the system</p>
        </div>
        <Link href="/admin/organizations/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Organization
          </Button>
        </Link>
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
