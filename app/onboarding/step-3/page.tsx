'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { isStep3FormValid } from '@/lib/onboarding-validation'
import {
  toggleDay as toggleDayUtil,
  toggleAllDays,
  areAllDaysSelected,
  DayCode,
} from '@/lib/day-selection'

const DAYS = [
  { id: 'mon' as DayCode, label: 'Monday', short: 'Mon' },
  { id: 'tue' as DayCode, label: 'Tuesday', short: 'Tue' },
  { id: 'wed' as DayCode, label: 'Wednesday', short: 'Wed' },
  { id: 'thu' as DayCode, label: 'Thursday', short: 'Thu' },
  { id: 'fri' as DayCode, label: 'Friday', short: 'Fri' },
  { id: 'sat' as DayCode, label: 'Saturday', short: 'Sat' },
  { id: 'sun' as DayCode, label: 'Sunday', short: 'Sun' },
]

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', label: 'Polish', flag: '🇵🇱' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
]

export default function Step3Page() {
  const router = useRouter()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [frequency, setFrequency] = useState<DayCode[]>([])
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load existing data and user email
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return
      try {
        // Pre-fill email from user
        if (user.email) {
          setEmail(user.email)
        }
        const data = await apiClient.get<{ delivery_days: string[]; preferred_language: string }>(
          `/onboarding/progress?user_id=${user.id}`
        )
        if (data.delivery_days?.length > 0) {
          setFrequency(data.delivery_days as DayCode[])
        }
        if (data.preferred_language) {
          setLanguage(data.preferred_language)
        }
      } catch {
        // No existing data
      } finally {
        setInitialLoading(false)
      }
    }
    loadExistingData()
  }, [user])

  const handleToggleDay = (dayId: DayCode) => {
    setFrequency(prev => toggleDayUtil(prev, dayId))
  }

  const isEveryday = areAllDaysSelected(frequency)

  const handleToggleEveryday = () => {
    setFrequency(prev => toggleAllDays(prev))
  }

  const handleComplete = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      await apiClient.post('/onboarding/step-3', {
        user_id: user.id,
        email,
        display_name: `${firstName} ${lastName}`.trim(),
        preferred_language: language,
        delivery_days: frequency,
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete setup'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const isValid = isStep3FormValid(email, firstName, lastName, frequency)
  const selectedLanguage = LANGUAGES.find(l => l.code === language)

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 mb-6 shadow-lg shadow-green-500/10">
          <Rocket className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Final Step - Delivery Settings</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          Configure how and when you'll receive your personalized articles
        </p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive max-w-4xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {/* User Information Card */}
          <Card className="border-2 overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-500/10 to-transparent">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Articles will be sent here</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="h-12 rounded-xl"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="h-12 rounded-xl"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Frequency Card */}
          <Card className="border-2 overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-purple-500/10 to-transparent">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Delivery Days
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Everyday Toggle */}
              <div
                onClick={handleToggleEveryday}
                className={`
                  w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${
                    isEveryday
                      ? 'border-purple-500 bg-purple-500/10 shadow-md'
                      : 'border-border hover:border-purple-500/30 hover:bg-secondary/30'
                  }
                  ${loading ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <Checkbox
                  checked={isEveryday}
                  onCheckedChange={handleToggleEveryday}
                  className="h-5 w-5"
                  disabled={loading}
                />
                <span
                  className={`font-semibold ${isEveryday ? 'text-purple-600 dark:text-purple-400' : ''}`}
                >
                  Every Day
                </span>
                {isEveryday && <Sparkles className="h-4 w-4 text-purple-500 ml-auto" />}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
                    Or select days
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DAYS.map(day => {
                  const isSelected = frequency.includes(day.id)
                  return (
                    <div
                      key={day.id}
                      onClick={() => !loading && handleToggleDay(day.id)}
                      className={`
                        flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
                        ${
                          isSelected
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-border/50 hover:border-purple-500/30 hover:bg-secondary/30'
                        }
                        ${loading ? 'opacity-50 pointer-events-none' : ''}
                      `}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleDay(day.id)}
                        className="h-4 w-4"
                        disabled={loading}
                      />
                      <span className="text-sm font-medium">{day.short}</span>
                    </div>
                  )
                })}
              </div>

              {frequency.length > 0 && (
                <div className="flex items-center gap-2 pt-2 text-sm">
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
          <Card className="border-2 overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-amber-500/10 to-transparent">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-amber-500" />
                Article Language
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Output language</Label>
                <Select value={language} onValueChange={setLanguage} disabled={loading}>
                  <SelectTrigger className="h-12 rounded-xl">
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
              </div>

              {/* Selected Language Preview */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{selectedLanguage?.flag}</span>
                  <div>
                    <p className="font-semibold text-lg">{selectedLanguage?.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Articles in {selectedLanguage?.label}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-primary">Note:</span> Your writing style is
                  analyzed regardless of the output language
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-8 border-t border-border/50 max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/onboarding/step-2')}
          disabled={loading}
          className="gap-2 border-2 h-12 px-6 bg-transparent rounded-xl hover:bg-muted/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          onClick={handleComplete}
          disabled={!isValid || loading}
          className={`
            gap-2 h-12 px-8 rounded-xl font-semibold
            transition-all duration-300
            ${
              isValid
                ? 'shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                : ''
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Complete Setup
            </>
          )}
        </Button>
      </div>

      {/* Completion Summary */}
      {isValid && (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/20">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Ready to launch!</h3>
                <p className="text-sm text-muted-foreground">
                  You'll receive articles at{' '}
                  <span className="font-medium text-foreground">{email}</span> on{' '}
                  <span className="font-medium text-foreground">
                    {isEveryday
                      ? 'every day'
                      : `${frequency.length} day${frequency.length !== 1 ? 's' : ''} per week`}
                  </span>{' '}
                  in <span className="font-medium text-foreground">{selectedLanguage?.label}</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
