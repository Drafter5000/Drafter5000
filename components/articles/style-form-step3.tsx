'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  User,
  Globe,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  Mail,
  Sparkles,
  FileText,
} from 'lucide-react';
import {
  toggleDay as toggleDayUtil,
  toggleAllDays,
  areAllDaysSelected,
  DayCode,
} from '@/lib/day-selection';
import { isStep3FormValid } from '@/lib/onboarding-validation';

const DAYS = [
  { id: 'mon' as DayCode, label: 'Monday', short: 'Mon' },
  { id: 'tue' as DayCode, label: 'Tuesday', short: 'Tue' },
  { id: 'wed' as DayCode, label: 'Wednesday', short: 'Wed' },
  { id: 'thu' as DayCode, label: 'Thursday', short: 'Thu' },
  { id: 'fri' as DayCode, label: 'Friday', short: 'Fri' },
  { id: 'sat' as DayCode, label: 'Saturday', short: 'Sat' },
  { id: 'sun' as DayCode, label: 'Sunday', short: 'Sun' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
];

interface Step3Data {
  name: string;
  email: string;
  display_name: string;
  preferred_language: string;
  delivery_days: string[];
}

interface StyleFormStep3Props {
  initialData?: Partial<Step3Data>;
  userEmail?: string;
  onSubmit: (data: Step3Data) => Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function StyleFormStep3({
  initialData = {},
  userEmail = '',
  onSubmit,
  onBack,
  loading = false,
  error = null,
}: StyleFormStep3Props) {
  const [name, setName] = useState(initialData.name || '');
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
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Style Name Card */}
        <Card className="border-2 pt-0 pb-6">
          <CardHeader className="py-4 bg-primary/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Style Name
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Give this style a name</Label>
              <Input
                id="name"
                placeholder="e.g., Tech Blog Style, Newsletter Voice"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Information Card */}
        <Card className="border-2 pt-0 pb-6">
          <CardHeader className="py-4 bg-blue-500/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frequency Card */}
        <Card className="border-2 pt-0 pb-6">
          <CardHeader className="py-4 bg-purple-500/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              Delivery Days
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div
              onClick={handleToggleEveryday}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                isEveryday
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-border hover:border-purple-500/30'
              } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Checkbox checked={isEveryday} disabled={loading} />
              <span className={`font-semibold ${isEveryday ? 'text-purple-600' : ''}`}>
                Every Day
              </span>
              {isEveryday && <Sparkles className="h-4 w-4 text-purple-500 ml-auto" />}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DAYS.map(day => {
                const isSelected = frequency.includes(day.id);
                return (
                  <div
                    key={day.id}
                    onClick={() => !loading && handleToggleDay(day.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-border/50 hover:border-purple-500/30'
                    } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <Checkbox checked={isSelected} disabled={loading} />
                    <span className="text-sm font-medium">{day.short}</span>
                  </div>
                );
              })}
            </div>

            {frequency.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{frequency.length}</span> day
                  {frequency.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language Card */}
        <Card className="border-2 pt-0 pb-6">
          <CardHeader className="py-4 bg-amber-500/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-amber-500" />
              Article Language
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
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
                    Articles in {selectedLanguage?.label}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={loading}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        {!onBack && <div />}

        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          size="lg"
          className={isValid ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Complete Setup
            </>
          )}
        </Button>
      </div>

      {isValid && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-semibold">Ready to create!</h3>
              <p className="text-sm text-muted-foreground">
                Style "{name}" will deliver articles to {email} on {frequency.length} day
                {frequency.length !== 1 ? 's' : ''} in {selectedLanguage?.label}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
