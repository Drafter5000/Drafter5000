'use client';

import { useContext } from 'react';
import { useAuth } from '@/components/auth-provider';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import {
  Win95Window,
  Win95Button,
  Win95Input,
  Win95Select,
  Win95Checkbox,
  Win95Alert,
} from '@/components/win95';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Settings, User, Calendar, Globe, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { LANGUAGES, DAYS } from '@/lib/constants';

export default function SettingsPage() {
  const { user } = useAuth();
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState('en');
  const [deliveryDays, setDeliveryDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      try {
        const data = await apiClient.get<{
          display_name: string | null;
          preferred_language: string;
          delivery_days: string[];
        }>(`/dashboard/settings?user_id=${user.id}`);

        if (data.display_name) setDisplayName(data.display_name);
        if (data.preferred_language) setLanguage(data.preferred_language);
        if (data.delivery_days?.length > 0) setDeliveryDays(data.delivery_days);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    loadSettings();
  }, [user]);

  const toggleDay = (dayId: string) => {
    setDeliveryDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const toggleAllDays = () => {
    if (deliveryDays.length === 7) {
      setDeliveryDays([]);
    } else {
      setDeliveryDays(DAYS.map(d => d.id));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      await apiClient.put('/dashboard/settings', {
        user_id: user.id,
        display_name: displayName,
        preferred_language: language,
        delivery_days: deliveryDays,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedLanguage = LANGUAGES.find(l => l.code === language);

  // Win95 Design
  if (designMode === 'win95') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4">
          <div className="max-w-3xl mx-auto">
            <DashboardHeader />

            <Win95Window title="Settings" icon={<span>⚙️</span>}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="win95-sunken p-2 flex items-center gap-2">
                    <span className="text-[16px]">⚙️</span>
                    <div>
                      <h2 className="text-[12px] font-bold">Settings</h2>
                      <p className="text-[10px] text-[var(--win95-button-shadow)]">
                        Manage your account and preferences
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard">
                    <Win95Button size="sm">← Back</Win95Button>
                  </Link>
                </div>

                {success && (
                  <Win95Alert type="success" title="Success">
                    Settings saved successfully!
                  </Win95Alert>
                )}

                {initialLoading ? (
                  <div className="text-center py-8">
                    <span className="text-[11px] win95-loading">Loading settings...</span>
                  </div>
                ) : (
                  <>
                    <div className="win95-groupbox">
                      <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                        <legend className="win95-groupbox-title font-bold">
                          👤 Account Information
                        </legend>
                        <div className="space-y-3">
                          <Win95Input
                            label="Email Address"
                            type="email"
                            value={user?.email || ''}
                            disabled
                          />
                          <Win95Input
                            label="Display Name"
                            placeholder="John Doe"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            disabled={loading}
                          />
                        </div>
                      </fieldset>
                    </div>

                    <div className="win95-groupbox">
                      <fieldset className="border border-[var(--win95-button-shadow)] p-3">
                        <legend className="win95-groupbox-title font-bold">
                          📅 Delivery Preferences
                        </legend>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[11px] font-bold mb-2">Select delivery days</p>
                            <div className="space-y-2">
                              <Win95Checkbox
                                checked={deliveryDays.length === 7}
                                onCheckedChange={toggleAllDays}
                                label="Every Day"
                                disabled={loading}
                              />
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                                {DAYS.map(day => (
                                  <Win95Checkbox
                                    key={day.id}
                                    checked={deliveryDays.includes(day.id)}
                                    onCheckedChange={() => toggleDay(day.id)}
                                    label={day.short}
                                    disabled={loading}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-bold mb-2">Article Language</p>
                            <Win95Select
                              value={language}
                              onValueChange={setLanguage}
                              options={LANGUAGES.map(l => ({
                                value: l.code,
                                label: `${l.flag} ${l.label}`,
                              }))}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </fieldset>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Win95Button onClick={handleSave} disabled={loading} size="lg">
                        {loading ? 'Saving...' : '💾 Save Changes'}
                      </Win95Button>
                    </div>
                  </>
                )}
              </div>
            </Win95Window>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Modern Design
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="pt-8 pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Settings</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your account and preferences
                  </p>
                </div>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
            </div>

            {success && (
              <Alert className="mb-6 border-green-500/30 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>Settings saved successfully!</AlertDescription>
              </Alert>
            )}

            {initialLoading ? (
              <div className="space-y-6">
                {/* Account Information Card Skeleton */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Preferences Card Skeleton */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-6 w-44" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Skeleton className="h-4 w-36 mb-3" />
                      <div className="space-y-3">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[...Array(7)].map((_, i) => (
                            <Skeleton key={i} className="h-10 rounded-lg" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Language Card Skeleton */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-6 w-36" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full rounded-md" />
                  </CardContent>
                </Card>

                {/* Save Button Skeleton */}
                <div className="flex justify-end">
                  <Skeleton className="h-11 w-32 rounded-md" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-500" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input type="email" value={user?.email || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      Delivery Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="mb-3 block">Select delivery days</Label>
                      <div className="space-y-3">
                        <div
                          className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer"
                          onClick={toggleAllDays}
                        >
                          <Checkbox checked={deliveryDays.length === 7} disabled={loading} />
                          <span className="font-semibold">Every Day</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {DAYS.map(day => (
                            <div
                              key={day.id}
                              className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer"
                              onClick={() => toggleDay(day.id)}
                            >
                              <Checkbox
                                checked={deliveryDays.includes(day.id)}
                                disabled={loading}
                              />
                              <span className="text-sm">{day.short}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-amber-500" />
                      Article Language
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={language} onValueChange={setLanguage} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue>
                          {selectedLanguage && `${selectedLanguage.flag} ${selectedLanguage.label}`}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.flag} {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={loading} size="lg">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
