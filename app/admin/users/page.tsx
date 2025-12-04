'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserTable } from '@/components/admin/user-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { AdminUserView, PaginatedResult, OrgRole } from '@/lib/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResult<AdminUserView>>({
    data: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async (page: number, searchQuery: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
      });
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, '');
  }, [fetchUsers]);

  const handleSearch = (query: string) => {
    setSearch(query);
    fetchUsers(1, query);
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page, search);
  };

  const handleRoleChange = async (userId: string, role: OrgRole) => {
    // Navigate to user details for role change
    router.push(`/admin/users/${userId}`);
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate' }),
      });

      if (!res.ok) throw new Error('Failed to deactivate user');
      fetchUsers(data.page, search);
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage all users in the system</p>
        </div>
        <Link href="/admin/users/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      <UserTable
        data={data}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onRoleChange={handleRoleChange}
        onDeactivate={handleDeactivate}
        loading={loading}
      />
    </div>
  );
}
