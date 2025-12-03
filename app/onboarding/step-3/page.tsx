'use client'

import { useState } from 'react'
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
import { Calendar, User, Globe, AlertCircle, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { isStep3FormValid } from '@/lib/onboarding-validation'
import {
  toggleDay as toggleDayUtil,
  toggleAllDays,
  areAllDaysSelected,
  DayCode,
} from '@/lib/day-selection'

const DAYS = [
  { id: 'mon' as DayCode, label: 'Monday' },
  { id: 'tue' as DayCode, label: 'Tuesday' },
  { id: 'wed' as DayCode, label: 'Wednesday' },
  { id: 'thu' as DayCode, label: 'Thursday' },
  { id: 'fri' as DayCode, label: 'Friday' },
  { id: 'sat' as DayCode, label: 'Saturday' },
  { id: 'sun' as DayCode, label: 'Sunday' },
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
  const [error, setError] = useState<string | null>(null)

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
      // Save to Supabase and provision customer in Google Sheets
      await apiClient.post('/onboarding/step-3', {
        user_id: user.id,
        email,
        display_name: `${firstName} ${lastName}`,
        preferred_language: language,
        delivery_days: frequency,
      })

      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup')
    } finally {
      setLoading(false)
    }
  }

  const isValid = isStep3FormValid(email, firstName, lastName, frequency)
  const selectedLanguage = LANGUAGES.find(l => l.code === language)

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-6">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Delivery Settings</h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          Configure how and when you receive your personalized articles
        </p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {/* User Information Card */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-12"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Articles will be sent here</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="h-12"
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
                    className="h-12"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Frequency Card */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Delivery Days
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div
                className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isEveryday
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/30 hover:bg-secondary/30'
                }`}
                onClick={handleToggleEveryday}
              >
                <Checkbox
                  id="everyday"
                  checked={isEveryday}
                  onCheckedChange={handleToggleEveryday}
                  className="h-5 w-5"
                  disabled={loading}
                />
                <Label
                  htmlFor="everyday"
                  className={`text-sm font-semibold cursor-pointer ${isEveryday ? 'text-primary' : ''}`}
                >
                  Every Day
                </Label>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                  Or select specific days
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map(day => (
                    <div
                      key={day.id}
                      className={`flex items-center space-x-2 p-2.5 rounded-lg border transition-all cursor-pointer ${
                        frequency.includes(day.id)
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border hover:border-primary/30 hover:bg-secondary/30'
                      }`}
                      onClick={() => handleToggleDay(day.id)}
                    >
                      <Checkbox
                        id={day.id}
                        checked={frequency.includes(day.id)}
                        onCheckedChange={() => handleToggleDay(day.id)}
                        className="h-4 w-4"
                        disabled={loading}
                      />
                      <Label htmlFor={day.id} className="text-sm font-medium cursor-pointer flex-1">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {frequency.length > 0 && (
                <div className="pt-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{frequency.length}</span> day
                  {frequency.length !== 1 ? 's' : ''} per week
                </div>
              )}
            </CardContent>
          </Card>

          {/* Language Card */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Article Language
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select output language</Label>
                <Select value={language} onValueChange={setLanguage} disabled={loading}>
                  <SelectTrigger className="h-12">
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

              <div className="p-4 rounded-xl bg-secondary/50 border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Selected Language
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedLanguage?.flag}</span>
                  <div>
                    <p className="font-semibold text-lg">{selectedLanguage?.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Articles in {selectedLanguage?.label}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-primary">Note:</span> Style is analyzed
                  regardless of language
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-6 max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/onboarding/step-2')}
          disabled={loading}
          className="gap-2 border-2 h-12 px-6 bg-transparent"
        >
          Back
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!isValid || loading}
          className="gap-2 shadow-lg shadow-primary/20 h-12 px-8"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Completing Setup...
            </>
          ) : (
            'Complete Setup'
          )}
        </Button>
      </div>
    </div>
  )
}
