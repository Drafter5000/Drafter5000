'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserForm } from '@/components/admin/user-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { AdminOrgView, AdminSession } from '@/lib/types';
import { UserRoleType } from '@/lib/types';
import { hasPlatformAccess, mapToUserRole } from '@/lib/role-config';

export default function NewUserPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [organizations, setOrganizations] = useState<AdminOrgView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch organizations only for Super Admins
  useEffect(() => {
    if (isPlatformAdmin && session) {
      const fetchOrganizations = async () => {
        try {
          const res = await fetch('/api/admin/organizations?page_size=100');
          if (res.ok) {
            const data = await res.json();
            setOrganizations(data.data || []);
          }
        } catch (err) {
          console.error('Error fetching organizations:', err);
        }
      };
      fetchOrganizations();
    }
  }, [isPlatformAdmin, session]);

  const handleSubmit = async (data: {
    email: string;
    display_name: string;
    password: string;
    userRoleType: UserRoleType;
    organization_id?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      router.push('/admin/users');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    ? 'Add a new user to any organization'
    : 'Add a new user to your organization';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create User</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <UserForm
          organizations={organizations}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          hideOrgSelector={!isPlatformAdmin}
          defaultOrgId={session?.organization_id || undefined}
        />
      </div>
    </div>
  );
}
