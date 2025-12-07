'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserTable } from '@/components/admin/user-table';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdminUserView, AdminOrgView, PaginatedResult, AdminSession } from '@/lib/types';
import { UserRoleType } from '@/lib/types';
import { hasPlatformAccess, mapToUserRole } from '@/lib/role-config';

export default function AdminUsersPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [data, setData] = useState<PaginatedResult<AdminUserView>>({
    data: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 0,
  });
  const [organizations, setOrganizations] = useState<AdminOrgView[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Check session
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

  // Determine user's role
  const userRoleType = session
    ? mapToUserRole(session.role, session.is_super_admin)
    : UserRoleType.CUSTOMER;
  const isPlatformAdmin = hasPlatformAccess(userRoleType);

  // Fetch organizations for Super Admin filter
  useEffect(() => {
    if (isPlatformAdmin && session) {
      const fetchOrgs = async () => {
        try {
          const res = await fetch('/api/admin/organizations?page_size=100');
          if (res.ok) {
            const result = await res.json();
            setOrganizations(result.data || []);
          }
        } catch (error) {
          console.error('Error fetching organizations:', error);
        }
      };
      fetchOrgs();
    }
  }, [isPlatformAdmin, session]);

  const fetchUsers = useCallback(async (page: number, searchQuery: string, orgId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
      });
      if (searchQuery) params.set('search', searchQuery);
      if (orgId) params.set('organization_id', orgId);

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
    if (session) {
      fetchUsers(1, '', selectedOrgId);
    }
  }, [fetchUsers, session, selectedOrgId]);

  const handleSearch = (query: string) => {
    setSearch(query);
    fetchUsers(1, query, selectedOrgId);
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page, search, selectedOrgId);
  };

  const handleOrgFilter = (orgId: string) => {
    const actualOrgId = orgId === 'all' ? '' : orgId;
    setSelectedOrgId(actualOrgId);
    fetchUsers(1, search, actualOrgId);
  };

  const handleRoleChange = async (userId: string, role: UserRoleType) => {
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
      fetchUsers(data.page, search, selectedOrgId);
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get description based on role
  const pageDescription = isPlatformAdmin
    ? 'Manage all users across all organizations'
    : 'Manage users in your organization';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <Link href="/admin/users/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      {/* Organization filter for Super Admins */}
      {isPlatformAdmin && organizations.length > 0 && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Filter by organization:</span>
          <Select value={selectedOrgId || 'all'} onValueChange={handleOrgFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="All organizations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All organizations</SelectItem>
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
