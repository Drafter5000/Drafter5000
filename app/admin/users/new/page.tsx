'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserForm } from '@/components/admin/user-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { AdminOrgView, OrgRole } from '@/lib/types';

export default function NewUserPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<AdminOrgView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  const handleSubmit = async (data: {
    email: string;
    display_name: string;
    password: string;
    role: OrgRole;
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
          <p className="text-muted-foreground">Add a new user to the system</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <UserForm
          organizations={organizations}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
