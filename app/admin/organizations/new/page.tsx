'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrgForm } from '@/components/admin/org-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { AdminUserView } from '@/lib/types';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users?page_size=100');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (data: {
    name: string;
    slug: string;
    logo_url?: string;
    initial_admin_id?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create organization');
      }

      router.push('/admin/organizations');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organizations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Organization</h1>
          <p className="text-muted-foreground">Add a new organization to the system</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <OrgForm users={users} onSubmit={handleSubmit} loading={loading} error={error} />
      </div>
    </div>
  );
}
