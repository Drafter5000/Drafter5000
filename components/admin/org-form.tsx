'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { AdminUserView } from '@/lib/types';

interface OrgFormProps {
  users?: AdminUserView[];
  onSubmit: (data: {
    name: string;
    slug: string;
    logo_url?: string;
    initial_admin_id?: string;
  }) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function OrgForm({ users, onSubmit, loading, error }: OrgFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [initialAdminId, setInitialAdminId] = useState<string>('');

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      slug,
      logo_url: logoUrl || undefined,
      initial_admin_id: initialAdminId || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Organization</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              placeholder="Acme Inc"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="acme-inc"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              required
              disabled={loading}
              pattern="[a-z0-9-]+"
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier (lowercase letters, numbers, and hyphens only)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
            <Input
              id="logoUrl"
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialAdmin">Initial Admin (Optional)</Label>
            <Select value={initialAdminId} onValueChange={setInitialAdminId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select initial admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No initial admin</SelectItem>
                {users?.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.display_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
