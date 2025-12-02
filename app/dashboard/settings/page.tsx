"use client"

import { useAuth } from "@/components/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"

const DAYS = [
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
  { id: "sun", label: "Sunday" },
]

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹" },
  { code: "nl", label: "Dutch", flag: "🇳🇱" },
  { code: "pl", label: "Polish", flag: "🇵🇱" },
  { code: "ru", label: "Russian", flag: "🇷🇺" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
]

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [language, setLanguage] = useState("en")
  const [deliveryDays, setDeliveryDays] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const toggleDay = (dayId: string) => {
    setDeliveryDays((prev) => (prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]))
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)

    try {
      await apiClient.put("/dashboard/settings", {
        user_id: user.id,
        email,
        display_name: displayName,
        preferred_language: language,
        delivery_days: deliveryDays,
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <DashboardHeader />

        <main className="pt-10 pb-20 px-6">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
              </div>
            </div>

            {success && (
              <div className="p-4 rounded-lg bg-green-100 border border-green-300 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                Settings saved successfully!
              </div>
            )}

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Delivery Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Select delivery days</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {DAYS.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.id}
                          checked={deliveryDays.includes(day.id)}
                          onCheckedChange={() => toggleDay(day.id)}
                          disabled={loading}
                        />
                        <Label htmlFor={day.id} className="font-normal cursor-pointer">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Article Language</Label>
                  <Select value={language} onValueChange={setLanguage} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSave}
              disabled={loading}
              size="lg"
              className="w-full gap-2 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
