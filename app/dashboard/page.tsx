"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardHeader } from "@/components/dashboard-header"
import { MetricCard } from "@/components/metric-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { FileText, Sparkles, Calendar, Mail, Plus, ArrowRight, AlertCircle } from "lucide-react"
import Link from "next/link"

const LANGUAGE_MAP: Record<string, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇺🇸" },
  es: { label: "Spanish", flag: "🇪🇸" },
  fr: { label: "French", flag: "🇫🇷" },
  de: { label: "German", flag: "🇩🇪" },
  it: { label: "Italian", flag: "🇮🇹" },
  pt: { label: "Portuguese", flag: "🇵🇹" },
  nl: { label: "Dutch", flag: "🇳🇱" },
  pl: { label: "Polish", flag: "🇵🇱" },
  ru: { label: "Russian", flag: "🇷🇺" },
  ja: { label: "Japanese", flag: "🇯🇵" },
  zh: { label: "Chinese", flag: "🇨🇳" },
  ko: { label: "Korean", flag: "🇰🇷" },
  ar: { label: "Arabic", flag: "🇸🇦" },
  hi: { label: "Hindi", flag: "🇮🇳" },
}

interface DashboardData {
  profile: {
    display_name: string
    email: string
    preferred_language: string
  }
  onboarding: {
    style_samples: string[]
    subjects: string[]
    delivery_days: string[]
  }
  metrics: {
    articles_generated: number
    articles_sent: number
    draft_articles: number
  }
  recentArticles: Array<{
    id: string
    subject: string
    status: "draft" | "pending" | "sent"
    generated_at: string
    sent_at: string | null
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        setLoading(true)
        const dashboardData = await apiClient.get<DashboardData>(`/dashboard/metrics?user_id=${user.id}`)
        setData(dashboardData)
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard")
        console.error("Dashboard error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <main className="pt-24 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !data) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <main className="pt-24 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>{error || "Failed to load dashboard"}</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  const firstName = data.profile.display_name.split(" ")[0]
  const dayLabels: Record<string, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  }
  const languageInfo = LANGUAGE_MAP[data.profile.preferred_language] || LANGUAGE_MAP["en"]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <DashboardHeader />

        <main className="pt-10 pb-20 px-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {firstName}! 👋</h2>
              <p className="text-muted-foreground text-lg">Here's an overview of your article generation system</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Articles Generated"
                value={data.metrics.articles_generated}
                description="Total articles created"
                icon={FileText}
                trend={{ value: 12, isPositive: true }}
              />
              <MetricCard
                title="Articles Sent"
                value={data.metrics.articles_sent}
                description="Delivered to your email"
                icon={Mail}
                trend={{ value: 8, isPositive: true }}
              />
              <MetricCard
                title="In Draft"
                value={data.metrics.draft_articles}
                description="Waiting for review"
                icon={Sparkles}
                trend={{ value: 3, isPositive: false }}
              />
              <MetricCard
                title="Topics Queue"
                value={data.onboarding.subjects.length}
                description="Subjects pending"
                icon={Plus}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Configuration Cards */}
              <div className="lg:col-span-2 space-y-6">
                {/* Your Settings */}
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Delivery Settings
                      </CardTitle>
                      <Link href="/dashboard/settings">
                        <Button variant="ghost" size="sm" className="gap-2">
                          Edit <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Email</p>
                        <p className="font-semibold text-sm break-all">{data.profile.email}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Name</p>
                        <p className="font-semibold text-sm">{data.profile.display_name}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                          Delivery Days ({data.onboarding.delivery_days.length}/7)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {data.onboarding.delivery_days.length === 7 ? (
                            <Badge>Everyday</Badge>
                          ) : (
                            data.onboarding.delivery_days.map((day) => (
                              <Badge key={day} variant="secondary">
                                {dayLabels[day]}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                          Language
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{languageInfo.flag}</span>
                          <span className="font-semibold text-sm">{languageInfo.label}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Writing Style */}
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Your Writing Style
                      </CardTitle>
                      <Link href="/onboarding/step-1">
                        <Button variant="ghost" size="sm" className="gap-2">
                          Update <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div>
                        <p className="text-sm text-muted-foreground">Trained on</p>
                        <p className="text-2xl font-bold text-primary">{data.onboarding.style_samples.length}</p>
                      </div>
                      <FileText className="h-8 w-8 text-primary/50" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Your AI model has analyzed {data.onboarding.style_samples.length} sample article
                      {data.onboarding.style_samples.length !== 1 ? "s" : ""} to learn your unique voice and writing
                      patterns.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Topics Queue Sidebar */}
              <Card className="border-2 lg:h-fit sticky top-24">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Topics Queue
                    </CardTitle>
                    <Link href="/onboarding/step-2">
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {data.onboarding.subjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Sparkles className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-3">No topics in queue</p>
                      <p className="text-xs text-muted-foreground mb-4">Add subjects to start generating articles</p>
                      <Link href="/onboarding/step-2" className="w-full">
                        <Button size="sm" className="w-full gap-2">
                          Add Topics <Plus className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.onboarding.subjects.slice(0, 8).map((subject, index) => (
                        <div
                          key={index}
                          className="text-sm p-3 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="font-medium line-clamp-2">{subject}</span>
                          </div>
                        </div>
                      ))}
                      {data.onboarding.subjects.length > 8 && (
                        <p className="text-xs text-muted-foreground p-3 text-center">
                          +{data.onboarding.subjects.length - 8} more topics
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Articles */}
            {data.recentArticles.length > 0 && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Recent Articles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.recentArticles.slice(0, 5).map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{article.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(article.generated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            article.status === "sent"
                              ? "default"
                              : article.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {article.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
