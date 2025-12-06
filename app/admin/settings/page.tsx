'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Settings, Shield, Database, CreditCard } from 'lucide-react';
import { PasswordResetForm } from '@/components/admin/password-reset-form';

interface AppSettings {
  siteName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxUsersPerOrg: number;
  trialEnabled: boolean;
  trialDays: number;
}

const defaultSettings: AppSettings = {
  siteName: '',
  supportEmail: '',
  maintenanceMode: false,
  allowRegistration: true,
  requireEmailVerification: true,
  maxUsersPerOrg: 50,
  trialEnabled: false,
  trialDays: 7,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings({ ...defaultSettings, ...data.settings });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage application settings and configurations</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-600'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              General Settings
            </CardTitle>
            <CardDescription>Basic application configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                placeholder="My Application"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                placeholder="support@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security Settings
            </CardTitle>
            <CardDescription>Authentication and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow new users to register accounts
                </p>
              </div>
              <Switch
                checked={settings.allowRegistration}
                onCheckedChange={checked =>
                  setSettings({ ...settings, allowRegistration: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Users must verify email before accessing the app
                </p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={checked =>
                  setSettings({ ...settings, requireEmailVerification: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              System Settings
            </CardTitle>
            <CardDescription>System-wide configurations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access for non-admin users
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={checked => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxUsers">Max Users Per Organization</Label>
              <Input
                id="maxUsers"
                type="number"
                min={1}
                value={settings.maxUsersPerOrg}
                onChange={e =>
                  setSettings({ ...settings, maxUsersPerOrg: parseInt(e.target.value) || 1 })
                }
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Subscription Settings
            </CardTitle>
            <CardDescription>Configure trial and subscription options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Free Trial</Label>
                <p className="text-sm text-muted-foreground">
                  Allow new subscribers to start with a free trial period
                </p>
              </div>
              <Switch
                checked={settings.trialEnabled}
                onCheckedChange={checked => setSettings({ ...settings, trialEnabled: checked })}
              />
            </div>
            {settings.trialEnabled && (
              <div className="grid gap-2">
                <Label htmlFor="trialDays">Trial Period (Days)</Label>
                <Input
                  id="trialDays"
                  type="number"
                  min={1}
                  max={30}
                  value={settings.trialDays}
                  onChange={e =>
                    setSettings({ ...settings, trialDays: parseInt(e.target.value) || 7 })
                  }
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Number of days for the free trial (1-30 days)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Reset */}
        <PasswordResetForm />
      </div>
    </div>
  );
}
