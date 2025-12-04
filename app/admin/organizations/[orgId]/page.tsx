'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Building2, Users, Calendar, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { AdminOrgView, OrgRole } from '@/lib/types';

interface OrgMember {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: OrgRole;
  joined_at: string;
}

export default function OrganizationDetailsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();
  const [organization, setOrganization] = useState<AdminOrgView | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const res = await fetch(`/api/admin/organizations/${orgId}`);
        if (!res.ok) throw new Error('Organization not found');
        const data = await res.json();
        setOrganization(data.organization);
        setMembers(data.members || []);
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganization();
  }, [orgId]);

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this organization?')) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate' }),
      });

      if (!res.ok) throw new Error('Failed to deactivate organization');
      router.push('/admin/organizations');
    } catch (error) {
      console.error('Error deactivating organization:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleReactivate = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });

      if (!res.ok) throw new Error('Failed to reactivate organization');
      // Refresh data
      const orgRes = await fetch(`/api/admin/organizations/${orgId}`);
      const data = await orgRes.json();
      setOrganization(data.organization);
    } catch (error) {
      console.error('Error reactivating organization:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeVariant = (role: OrgRole) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Organization not found</p>
        <Link href="/admin/organizations">
          <Button variant="link">Back to organizations</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/organizations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {organization.logo_url ? (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{organization.name}</h1>
              <p className="text-muted-foreground">/{organization.slug}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {organization.is_active ? (
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{organization.member_count}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{organization.admin_count}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Date(organization.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                members.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.display_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
