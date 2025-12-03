'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Info,
  Circle,
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { countWords, isStyleSampleValid } from '@/lib/onboarding-validation'

export default function Step1Page() {
  const router = useRouter()
  const { user } = useAuth()
  const [articles, setArticles] = useState(['', '', ''])
  const [activeTab, setActiveTab] = useState('1')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return
      try {
        const data = await apiClient.get<{ style_samples: string[] }>(
          `/onboarding/progress?user_id=${user.id}`
        )
        if (data.style_samples?.length > 0) {
          const padded = [...data.style_samples, '', '', ''].slice(0, 3)
          setArticles(padded)
        }
      } catch {
        // No existing data
      } finally {
        setInitialLoading(false)
      }
    }
    loadExistingData()
  }, [user])

  const updateArticle = (index: number, value: string) => {
    const updated = [...articles]
    updated[index] = value
    setArticles(updated)
  }

  const hasAtLeastOneArticle = isStyleSampleValid(articles)
  const filledCount = articles.filter(a => a.trim().length > 0).length
  const progressValue = (filledCount / 3) * 100

  const handleNext = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      await apiClient.post('/onboarding/step-1', {
        user_id: user.id,
        style_samples: articles.filter(a => a.trim()),
      })
      router.push('/onboarding/step-2')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save articles'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const getArticleStatus = (index: number) => {
    const hasContent = articles[index].trim().length > 0
    const wordCount = countWords(articles[index])
    return { hasContent, wordCount }
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Define Your Writing Style</h1>
          <p className="text-muted-foreground mt-2">
            Share up to 3 articles so our AI can learn your unique voice
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{filledCount} of 3 articles</span>
          </div>
          <Progress value={progressValue} className="h-2" />
          <div className="flex justify-between mt-3">
            {[1, 2, 3].map((num, index) => {
              const { hasContent } = getArticleStatus(index)
              return (
                <div key={num} className="flex items-center gap-2 text-sm">
                  {hasContent ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={hasContent ? 'text-foreground' : 'text-muted-foreground'}>
                    Article {num}
                  </span>
                  {num === 1 && !hasContent && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Paste articles you have written or content whose style you want to emulate. At least one
          article is required, but more samples improve accuracy.
        </AlertDescription>
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Article Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4">
            <TabsList>
              {[1, 2, 3].map((num, index) => {
                const { hasContent, wordCount } = getArticleStatus(index)
                return (
                  <TabsTrigger key={num} value={String(num)} className="gap-2 cursor-pointer">
                    {hasContent ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="h-5 w-5 rounded-full bg-muted text-xs flex items-center justify-center">
                        {num}
                      </span>
                    )}
                    <span className="hidden sm:inline">Article {num}</span>
                    <span className="sm:hidden">{num}</span>
                    {hasContent && (
                      <Badge variant="outline" className="text-xs hidden md:inline-flex">
                        {wordCount}w
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {[1, 2, 3].map((num, index) => {
            const { hasContent, wordCount } = getArticleStatus(index)
            return (
              <TabsContent key={num} value={String(num)} className="mt-0">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Article {num}</h3>
                      <p className="text-sm text-muted-foreground">
                        {num === 1
                          ? 'This article is required to continue'
                          : 'Optional - add more samples for better results'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasContent && <Badge variant="secondary">{wordCount} words</Badge>}
                      {num > 1 && <Badge variant="outline">Optional</Badge>}
                    </div>
                  </div>

                  <Textarea
                    placeholder={`Paste your ${num === 1 ? 'first' : num === 2 ? 'second' : 'third'} article here...\n\nThis could be a blog post, newsletter, essay, or any written content that represents your writing style.`}
                    className="min-h-[320px] resize-none text-base leading-relaxed"
                    value={articles[index]}
                    onChange={e => updateArticle(index, e.target.value)}
                  />

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{wordCount} words</span>
                      <span>{articles[index].length} characters</span>
                    </div>
                    {wordCount >= 100 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Good length</span>
                      </div>
                    )}
                    {wordCount > 0 && wordCount < 50 && (
                      <span className="text-amber-600 text-xs">Consider adding more content</span>
                    )}
                  </div>

                  {/* Navigation between tabs */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={num === 1}
                      onClick={() => setActiveTab(String(num - 1))}
                    >
                      Previous Article
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={num === 3}
                      onClick={() => setActiveTab(String(num + 1))}
                    >
                      Next Article
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>
            )
          })}
        </Tabs>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {hasAtLeastOneArticle ? (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Ready to continue
            </span>
          ) : (
            'Add at least one article to continue'
          )}
        </div>

        <Button onClick={handleNext} disabled={!hasAtLeastOneArticle || loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
