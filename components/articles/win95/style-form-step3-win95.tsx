'use client';

import { useState } from 'react';
import {
  Win95Window,
  Win95Button,
  Win95Input,
  Win95Select,
  Win95Checkbox,
  Win95Alert,
} from '@/components/win95';
import {
  toggleDay as toggleDayUtil,
  toggleAllDays,
  areAllDaysSelected,
  DayCode,
} from '@/lib/day-selection';
import { isStep3FormValid } from '@/lib/onboarding-validation';
import { LANGUAGES, DAYS } from '@/lib/constants';

interface Step3Data {
  name: string;
  email: string;
  display_name: string;
  preferred_language: string;
  delivery_days: string[];
}

interface StyleFormStep3Win95Props {
  initialData?: Partial<Step3Data>;
  userEmail?: string;
  onSubmit: (data: Step3Data) => Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function StyleFormStep3Win95({
  initialData = {},
  userEmail = '',
  onSubmit,
  onBack,
  loading = false,
  error = null,
}: StyleFormStep3Win95Props) {
  const [name, setName] = useState(
    initialData.name === 'Untitled Style' || initialData.name === 'Settings'
      ? ''
      : initialData.name || ''
  );
  const [email, setEmail] = useState(initialData.email || userEmail);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [frequency, setFrequency] = useState<DayCode[]>(
    (initialData.delivery_days || []) as DayCode[]
  );
  const [language, setLanguage] = useState(initialData.preferred_language || 'en');

  // Parse display_name into first/last
  useState(() => {
    if (initialData.display_name) {
      const parts = initialData.display_name.trim().split(/\s+/);
      if (parts.length >= 2) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(' '));
      } else if (parts.length === 1) {
        setFirstName(parts[0]);
      }
    }
  });

  const handleToggleDay = (dayId: DayCode) => {
    setFrequency(prev => toggleDayUtil(prev, dayId));
  };

  const isEveryday = areAllDaysSelected(frequency);

  const handleToggleEveryday = () => {
    setFrequency(prev => toggleAllDays(prev));
  };

  const displayName = `${firstName} ${lastName}`.trim();
  const isValid = isStep3FormValid(email, firstName, lastName, frequency) && name.trim().length > 0;
  const selectedLanguage = LANGUAGES.find(l => l.code === language);

  const handleSubmit = () => {
    onSubmit({
      name: name.trim(),
      email,
      display_name: displayName,
      preferred_language: language,
      delivery_days: frequency,
    });
  };

  return (
    <div className="space-y-4">
      {error && <Win95Alert type="error">{error}</Win95Alert>}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Style Name */}
        <Win95Window title="Style Name" icon={<span>📄</span>} showControls={false}>
          <div className="space-y-3">
            <Win95Input
              label="Give this style a name *"
              placeholder="Settings"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
            />
            {name.trim().length === 0 && (
              <p className="text-[10px] text-[var(--win95-button-shadow)]">
                Style name is required
              </p>
            )}
          </div>
        </Win95Window>

        {/* User Information */}
        <Win95Window title="Your Information" icon={<span>👤</span>} showControls={false}>
          <div className="space-y-3">
            <Win95Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
            <div className="grid grid-cols-2 gap-2">
              <Win95Input
                label="First Name"
                placeholder="John"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                disabled={loading}
              />
              <Win95Input
                label="Last Name"
                placeholder="Doe"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </Win95Window>

        {/* Delivery Days */}
        <Win95Window title="Delivery Days" icon={<span>📅</span>} showControls={false}>
          <div className="space-y-3">
            <Win95Checkbox
              label="Every Day"
              checked={isEveryday}
              onCheckedChange={handleToggleEveryday}
              disabled={loading}
            />

            <div className="grid grid-cols-2 gap-2">
              {DAYS.map(day => (
                <Win95Checkbox
                  key={day.id}
                  label={day.short}
                  checked={frequency.includes(day.id)}
                  onCheckedChange={() => handleToggleDay(day.id)}
                  disabled={loading}
                />
              ))}
            </div>

            {frequency.length > 0 && (
              <p className="text-[10px] text-[var(--win95-success)]">
                ✓ {frequency.length} day{frequency.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </Win95Window>

        {/* Language */}
        <Win95Window title="Article Language" icon={<span>🌐</span>} showControls={false}>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px]">Select Language</label>
              <Win95Select
                value={language}
                onValueChange={setLanguage}
                disabled={loading}
                options={LANGUAGES.map(lang => ({
                  value: lang.code,
                  label: `${lang.flag} ${lang.label}`,
                }))}
              />
            </div>

            <div className="win95-sunken p-2">
              <div className="flex items-center gap-2">
                <span className="text-[20px]">{selectedLanguage?.flag}</span>
                <div>
                  <p className="text-[11px] font-bold">{selectedLanguage?.label}</p>
                  <p className="text-[10px] text-[var(--win95-button-shadow)]">
                    Articles in {selectedLanguage?.label}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Win95Window>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-2 border-t border-[var(--win95-button-shadow)]">
        {onBack ? (
          <Win95Button onClick={onBack} disabled={loading}>
            ← Back
          </Win95Button>
        ) : (
          <div />
        )}

        <Win95Button onClick={handleSubmit} disabled={!isValid || loading} variant="primary">
          {loading ? 'Creating...' : '🚀 Complete Setup'}
        </Win95Button>
      </div>

      {/* Ready Message */}
      {isValid && (
        <Win95Alert type="success">
          <strong>Ready to create!</strong> Style "{name}" will deliver articles to {email} on{' '}
          {frequency.length} day{frequency.length !== 1 ? 's' : ''} in {selectedLanguage?.label}.
        </Win95Alert>
      )}
    </div>
  );
}
