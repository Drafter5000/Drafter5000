'use client';

import { useAuth } from '@/components/auth-provider';
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
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

const DAYS = [
  { id: 'mon', label: 'Monday', short: 'Mon' },
  { id: 'tue', label: 'Tuesday', short: 'Tue' },
  { id: 'wed', label: 'Wednesday', short: 'Wed' },
  { id: 'thu', label: 'Thursday', short: 'Thu' },
  { id: 'fri', label: 'Friday', short: 'Fri' },
  { id: 'sat', label: 'Saturday', short: 'Sat' },
  { id: 'sun', label: 'Sunday', short: 'Sun' },
];

const LANGUAGES = [
  { value: 'en', label: '🇺🇸 English' },
  { value: 'es', label: '🇪🇸 Spanish' },
  { value: 'fr', label: '🇫🇷 French' },
  { value: 'de', label: '🇩🇪 German' },
  { value: 'it', label: '🇮🇹 Italian' },
  { value: 'pt', label: '🇵🇹 Portuguese' },
  { value: 'nl', label: '🇳🇱 Dutch' },
  { value: 'pl', label: '🇵🇱 Polish' },
  { value: 'ru', label: '🇷🇺 Russian' },
  { value: 'ja', label: '🇯🇵 Japanese' },
  { value: 'zh', label: '🇨🇳 Chinese' },
  { value: 'ko', label: '🇰🇷 Korean' },
  { value: 'ar', label: '🇸🇦 Arabic' },
  { value: 'hi', label: '🇮🇳 Hindi' },
];

export default function SettingsPage() {
  const { user } = useAuth();
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

        if (data.display_name) {
          setDisplayName(data.display_name);
        }
        if (data.preferred_language) {
          setLanguage(data.preferred_language);
        }
        if (data.delivery_days?.length > 0) {
          setDeliveryDays(data.delivery_days);
        }
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4">
        <div className="max-w-3xl mx-auto">
          <DashboardHeader />

          <Win95Window title="Settings" icon={<span>⚙️</span>}>
            <div className="space-y-4">
              {/* Header */}
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
                  {/* Account Information */}
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

                  {/* Delivery Preferences */}
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
                            options={LANGUAGES}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-2">
                    <Win95Button
                      onClick={handleSave}
                      disabled={loading}
                      size="lg"
                      className={loading ? 'win95-loading' : ''}
                    >
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
