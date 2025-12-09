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
  Lock,
  Briefcase,
} from 'lucide-react';
import {
  toggleDay as toggleDayUtil,
  toggleAllDays,
  areAllDaysSelected,
  DayCode,
} from '@/lib/day-selection';
import { validateSignupForm } from '@/lib/onboarding-validation';

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

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  job: string;
  preferred_language: string;
  delivery_days: string[];
}

interface StyleFormStep3SignupProps {
  initialData?: Partial<SignupFormData>;
  onSubmit: (data: SignupFormData) => Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * Step 3 Signup Form Component
 * Requirements: 4.1, 4.2, 8.3
 */
export function StyleFormStep3Signup({
  initialData = {},
  onSubmit,
  onBack,
  loading = false,
  error = null,
}: StyleFormStep3SignupProps) {
  const [name, setName] = useState(initialData.name || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [job, setJob] = useState(initialData.job || '');
  const [frequency, setFrequency] = useState<DayCode[]>(
    (initialData.delivery_days || []) as DayCode[]
  );
  const [language, setLanguage] = useState(initialData.preferred_language || 'en');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleToggleDay = (dayId: DayCode) => {
    setFrequency(prev => toggleDayUtil(prev, dayId));
  };

  const isEveryday = areAllDaysSelected(frequency);

  const handleToggleEveryday = () => {
    setFrequency(prev => toggleAllDays(prev));
  };

  // Validate form
  const validation = validateSignupForm({ name, email, password, confirmPassword, job });
  const isValid = validation.valid && frequency.length > 0;
  const selectedLanguage = LANGUAGES.find(l => l.code === language);

  const handleSubmit = () => {
    // Validate and show field errors
    const result = validateSignupForm({ name, email, password, confirmPassword, job });
    if (!result.valid) {
      setFieldErrors(result.errors);
      return;
    }
    if (frequency.length === 0) {
      setFieldErrors({
        ...result.errors,
        delivery_days: 'Please select at least one delivery day',
      });
      return;
    }
    setFieldErrors({});

    onSubmit({
      name,
      email,
      password,
      confirmPassword,
      job,
      preferred_language: language,
      delivery_days: frequency,
    });
  };

  return (
    <div className="space-y-6">
      {/* Final step messaging */}
      <Alert className="bg-primary/5 border-primary/20">
        <Rocket className="h-4 w-4 text-primary" />
        <AlertDescription className="text-primary">
          Final step! Create your account to start receiving AI-generated articles in your style.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Account Information Card */}
        <Card className="border-2 pt-0 pb-6">
          <CardHeader className="py-4 bg-blue-500/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
                className={fieldErrors.name ? 'border-destructive' : ''}
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                className={fieldErrors.email ? 'border-destructive' : ''}
              />
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job" className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                Job Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="job"
                placeholder="Marketing Manager"
                value={job}
                onChange={e => setJob(e.target.value)}
                disabled={loading}
                className={fieldErrors.job ? 'border-destructive' : ''}
              />
              {fieldErrors.job && <p className="text-xs text-destructive">{fieldErrors.job}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card className="border-2 pt-0 pb-6">
          <CardHeader className="py-4 bg-purple-500/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-500" />
              Set Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                className={fieldErrors.password ? 'border-destructive' : ''}
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
                className={fieldErrors.confirmPassword ? 'border-destructive' : ''}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Days Card */}
        <Card className="border-2 pt-0 pb-6">
          <CardHeader className="py-4 bg-green-500/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Delivery Days
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div
              onClick={handleToggleEveryday}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                isEveryday
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-border hover:border-green-500/30'
              } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Checkbox checked={isEveryday} disabled={loading} />
              <span className={`font-semibold ${isEveryday ? 'text-green-600' : ''}`}>
                Every Day
              </span>
              {isEveryday && <Sparkles className="h-4 w-4 text-green-500 ml-auto" />}
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
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-border/50 hover:border-green-500/30'
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
            {fieldErrors.delivery_days && (
              <p className="text-xs text-destructive">{fieldErrors.delivery_days}</p>
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
              Creating Account...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Create Account & Pay
            </>
          )}
        </Button>
      </div>

      {isValid && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-semibold">Ready to go!</h3>
              <p className="text-sm text-muted-foreground">
                You'll receive articles on {frequency.length} day
                {frequency.length !== 1 ? 's' : ''} in {selectedLanguage?.label}. After payment,
                your personalized articles will start arriving.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
