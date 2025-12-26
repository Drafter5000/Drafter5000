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
import type { AdminOrgView } from '@/lib/types';
import { UserRoleType } from '@/lib/types';
import { getRoleOptions } from '@/lib/role-config';

interface FieldErrors {
  email?: string;
  displayName?: string;
  password?: string;
  organizationId?: string;
}

interface UserFormProps {
  organizations?: AdminOrgView[];
  onSubmit: (data: {
    email: string;
    display_name: string;
    password: string;
    userRoleType: UserRoleType;
    organization_id?: string;
  }) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  /** If true, hides organization selector (for Customer Admin creating users in their org) */
  hideOrgSelector?: boolean;
  /** Default organization ID when org selector is hidden */
  defaultOrgId?: string;
}

export function UserForm({
  organizations,
  onSubmit,
  loading,
  error,
  hideOrgSelector = false,
  defaultOrgId,
}: UserFormProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [userRoleType, setUserRoleType] = useState<UserRoleType>(UserRoleType.CUSTOMER);
  const [organizationId, setOrganizationId] = useState<string>(defaultOrgId || '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const roleOptions = getRoleOptions();

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!displayName.trim()) {
      errors.displayName = 'Display name is required';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!hideOrgSelector && !organizationId) {
      errors.organizationId = 'Organization is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    await onSubmit({
      email,
      display_name: displayName,
      password,
      userRoleType,
      organization_id: hideOrgSelector ? defaultOrgId : organizationId,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                }}
                disabled={loading}
                className={fieldErrors.email ? 'border-destructive' : ''}
              />
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                placeholder="John Doe"
                value={displayName}
                onChange={e => {
                  setDisplayName(e.target.value);
                  if (fieldErrors.displayName)
                    setFieldErrors(prev => ({ ...prev, displayName: undefined }));
                }}
                disabled={loading}
                className={fieldErrors.displayName ? 'border-destructive' : ''}
              />
              {fieldErrors.displayName && (
                <p className="text-xs text-destructive">{fieldErrors.displayName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors(prev => ({ ...prev, password: undefined }));
              }}
              disabled={loading}
              className={fieldErrors.password ? 'border-destructive' : ''}
            />
            {fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          <div className={`grid gap-4 ${hideOrgSelector ? '' : 'md:grid-cols-2'}`}>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={userRoleType}
                onValueChange={v => setUserRoleType(v as UserRoleType)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleOptions.find(r => r.value === userRoleType)?.description}
              </p>
            </div>

            {!hideOrgSelector && (
              <div className="space-y-2">
                <Label htmlFor="organization">
                  Organization <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={organizationId || 'placeholder'}
                  onValueChange={v => {
                    setOrganizationId(v === 'placeholder' ? '' : v);
                    if (fieldErrors.organizationId)
                      setFieldErrors(prev => ({ ...prev, organizationId: undefined }));
                  }}
                  disabled={loading}
                >
                  <SelectTrigger className={fieldErrors.organizationId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.organizationId && (
                  <p className="text-xs text-destructive">{fieldErrors.organizationId}</p>
                )}
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
