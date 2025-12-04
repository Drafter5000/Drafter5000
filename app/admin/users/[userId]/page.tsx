'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Mail, Calendar, Building2, CreditCard, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { AdminUserView, OrgRole } from '@/lib/types';

export default function UserDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<AdminUserView | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate' }),
      });

      if (!res.ok) throw new Error('Failed to deactivate user');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error deactivating user:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleReactivate = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });

      if (!res.ok) throw new Error('Failed to reactivate user');
      // Refresh user data
      const userRes = await fetch(`/api/admin/users/${userId}`);
      const data = await userRes.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error reactivating user:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">User not found</p>
        <Link href="/admin/users">
          <Button variant="link">Back to users</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{user.display_name || 'No name'}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {user.is_active ? (
            <Button variant="destructive" onClick={handleDeactivate} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Deactivate
            </Button>
          ) : (
            <Button onClick={handleReactivate} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role & Organization */}
        <Card>
          <CardHeader>
            <CardTitle>Role & Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <Badge variant={user.is_super_admin ? 'destructive' : 'default'}>
                  {user.is_super_admin ? 'Super Admin' : user.role || 'No role'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Organization</p>
                <p className="font-medium">{user.organization_name || 'None'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Subscription</p>
                <div className="flex gap-2">
                  <Badge variant="outline">{user.subscription_plan}</Badge>
                  <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {user.subscription_status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
