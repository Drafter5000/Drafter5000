'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { EditStyleContext } from '../layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Win95Button,
  Win95Input,
  Win95Select,
  Win95Checkbox,
  Win95Alert,
} from '@/components/win95';
import {
  Settings,
  Calendar,
  Globe,
  User,
  Mail,
  FileText,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Save,
} from 'lucide-react';
import {
  toggleDay as toggleDayUtil,
  toggleAllDays,
  areAllDaysSelected,
  DayCode,
} from '@/lib/day-selection';
import { LANGUAGES, DAYS } from '@/lib/constants';

export default function EditStep3Page() {
  const router = useRouter();
  const params = useParams();
  const styleId = params.id as string;
  const editContext = useContext(EditStyleContext);
  const designContext = useContext(DesignContext);
  const designMode: DesignMode = designContext?.designMode ?? 'modern';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [frequency, setFrequency] = useState<DayCode[]>([]);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize from style data
  useEffect(() => {
    if (editContext?.style && !initialized) {
      const style = editContext.style;
      setName(style.name || '');
      setEmail(style.email || '');
      setFrequency((style.delivery_days || []) as DayCode[]);
      setLanguage(style.preferred_language || 'en');

      if (style.display_name) {
        const parts = style.display_name.trim().split(/\s+/);
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      setInitialized(true);
    }
  }, [editContext?.style, initialized]);

  const handleToggleDay = (dayId: DayCode) => {
    setFrequency(prev => toggleDayUtil(prev, dayId));
  };

  const isEveryday = areAllDaysSelected(frequency);

  const handleToggleEveryday = () => {
    setFrequency(prev => toggleAllDays(prev));
  };

  const isValid = name.trim().length > 0 && frequency.length > 0;
  const selectedLanguage = LANGUAGES.find(l => l.code === language);

  const handleSubmit = async () => {
    if (!isValid) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update the style in context with all settings
      editContext?.updateStyle({
        name: name.trim(),
        email,
        display_name: `${firstName} ${lastName}`.trim(),
        preferred_language: language,
        delivery_days: frequency,
      });

      // Save to API
      await editContext?.saveStyle();

      setSuccess(true);
      setTimeout(() => {
        router.push(`/articles/styles/${styleId}`);
      }, 1500);
    } catch (err) {
      setError('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Save current state before going back
    editContext?.updateStyle({
      name: name.trim(),
      email,
      display_name: `${firstName} ${lastName}`.trim(),
      preferred_language: language,
      delivery_days: frequency,
    });
    router.push(`/articles/styles/${styleId}/edit/step-2`);
  };

  if (editContext?.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Win95 Design
  if (designMode === 'win95') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-[32px] mb-2">⚙️</div>
          <h2 className="text-[14px] font-bold">Edit Settings</h2>
          <p className="text-[11px] text-[var(--win95-button-shadow)]">
            Update your style settings and preferences
          </p>
        </div>

        {error && (
          <Win95Alert type="error" title="Error">
            {error}
          </Win95Alert>
        )}
        {success && (
          <Win95Alert type="success" title="Success">
            Style updated successfully!
          </Win95Alert>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="win95-sunken p-3">
            <div className="text-[11px] font-bold mb-3">📄 Style Name</div>
            <Win95Input
              label="Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="win95-sunken p-3">
            <div className="text-[11px] font-bold mb-3">👤 Your Info</div>
            <div className="space-y-2">
              <Win95Input
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
              <div className="grid grid-cols-2 gap-2">
                <Win95Input
                  label="First Name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  disabled={loading}
                />
                <Win95Input
                  label="Last Name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="win95-sunken p-3">
            <div className="text-[11px] font-bold mb-3">📅 Delivery Days</div>
            <div className="space-y-2">
              <Win95Checkbox
                checked={isEveryday}
                onCheckedChange={handleToggleEveryday}
                label="Every Day"
                disabled={loading}
              />
              <div className="grid grid-cols-2 gap-1">
                {DAYS.map(day => (
                  <Win95Checkbox
                    key={day.id}
                    checked={frequency.includes(day.id)}
                    onCheckedChange={() => handleToggleDay(day.id)}
                    label={day.short}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="win95-sunken p-3">
            <div className="text-[11px] font-bold mb-3">🌐 Language</div>
            <Win95Select
              value={language}
              onValueChange={setLanguage}
              options={LANGUAGES.map(l => ({ value: l.code, label: `${l.flag} ${l.label}` }))}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Win95Button onClick={handleBack} disabled={loading}>
            ← Back
          </Win95Button>
          <Win95Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? 'Saving...' : '💾 Save Changes'}
          </Win95Button>
        </div>
      </div>
    );
  }

  // Modern Design
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <Settings className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Edit Settings</h2>
        <p className="text-muted-foreground">Update your style settings and preferences</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Style updated successfully! Redirecting...</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Style Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Style Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                Style Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
                placeholder="My Writing Style"
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-3 w-3" /> Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Days */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" /> Delivery Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onClick={handleToggleEveryday}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                isEveryday
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-border hover:border-emerald-500/30'
              } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Checkbox checked={isEveryday} disabled={loading} />
              <span className={`font-medium ${isEveryday ? 'text-emerald-600' : ''}`}>
                Every Day
              </span>
              {isEveryday && <Sparkles className="h-4 w-4 text-emerald-500 ml-auto" />}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DAYS.map(day => {
                const isSelected = frequency.includes(day.id);
                return (
                  <div
                    key={day.id}
                    onClick={() => !loading && handleToggleDay(day.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-border/50 hover:border-emerald-500/30'
                    } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <Checkbox checked={isSelected} disabled={loading} />
                    <span className="text-sm font-medium">{day.short}</span>
                  </div>
                );
              })}
            </div>
            {frequency.length > 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {frequency.length} day{frequency.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-amber-600" /> Article Language
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={language} onValueChange={setLanguage} disabled={loading}>
              <SelectTrigger>
                <SelectValue>
                  {selectedLanguage && (
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{selectedLanguage.flag}</span>
                      <span>{selectedLanguage.label}</span>
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedLanguage?.flag}</span>
                <div>
                  <p className="font-semibold">{selectedLanguage?.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Articles will be written in {selectedLanguage?.label}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ready message */}
      {isValid && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div>
              <h3 className="font-semibold">Ready to save!</h3>
              <p className="text-sm text-muted-foreground">
                Your style will be updated with the new settings.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={handleBack} disabled={loading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          size="lg"
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
