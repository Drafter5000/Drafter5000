'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Plus,
  Sparkles,
  X,
  Loader2,
  Lightbulb,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { isSubjectValid, isSubjectListValid } from '@/lib/onboarding-validation'

const AI_SUGGESTIONS = [
  'The Future of Remote Work in 2025',
  'Building a Personal Brand Online',
  'Productivity Hacks That Actually Work',
  'The Art of Effective Communication',
  'Sustainable Living Tips for Beginners',
  'Mental Health in the Digital Age',
  'Investing Strategies for Millennials',
  'The Power of Habit Formation',
]

export default function Step2Page() {
  const router = useRouter()
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [aiActive, setAiActive] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return
      try {
        const data = await apiClient.get<{ subjects: string[] }>(
          `/onboarding/progress?user_id=${user.id}`
        )
        if (data.subjects?.length > 0) {
          setSubjects(data.subjects)
        }
      } catch {
        // No existing data
      } finally {
        setInitialLoading(false)
      }
    }
    loadExistingData()
  }, [user])

  const addSubject = (subject: string) => {
    if (isSubjectValid(subject, subjects)) {
      setSubjects([...subjects, subject.trim()])
    }
    setInputValue('')
  }

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index))
  }

  const activateAI = () => {
    setAiLoading(true)
    setTimeout(() => {
      setAiActive(true)
      setAiSuggestions(AI_SUGGESTIONS.filter(s => !subjects.includes(s)))
      setAiLoading(false)
    }, 800)
  }

  const addFromAI = (suggestion: string) => {
    if (isSubjectValid(suggestion, subjects)) {
      setSubjects([...subjects, suggestion])
      setAiSuggestions(aiSuggestions.filter(s => s !== suggestion))
    }
  }

  const handleNext = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      await apiClient.post('/onboarding/step-2', {
        user_id: user.id,
        subjects,
      })
      router.push('/onboarding/step-3')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save subjects'
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

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-500/10">
          <Lightbulb className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Choose Your Topics</h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Add subjects you want to write about. Each topic becomes one article in your queue.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Your Topics
              </CardTitle>
              {subjects.length > 0 && <Badge variant="secondary">{subjects.length} added</Badge>}
            </div>
            <CardDescription>Type a topic and press Enter or click Add</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a topic..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSubject(inputValue)
                  }
                }}
              />
              <Button onClick={() => addSubject(inputValue)} disabled={!inputValue.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="min-h-[280px] max-h-[320px] overflow-y-auto space-y-2">
              {subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Lightbulb className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No topics added yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add your first topic above or use AI suggestions
                  </p>
                </div>
              ) : (
                subjects.map((subject, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card group hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="h-6 w-6 p-0 justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium">{subject}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubject(index)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Suggestions
              </CardTitle>
              {!aiActive && (
                <Button onClick={activateAI} size="sm" disabled={aiLoading}>
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Generate Ideas'
                  )}
                </Button>
              )}
            </div>
            <CardDescription>
              {aiActive ? 'Click a suggestion to add it' : 'Get AI-powered topic ideas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!aiActive ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Need inspiration?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click Generate Ideas to get suggestions
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {aiSuggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="h-6 w-6 text-primary mb-3" />
                    <p className="text-sm font-medium text-primary">All suggestions added!</p>
                  </div>
                ) : (
                  aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => addFromAI(suggestion)}
                      className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-colors text-sm flex items-center gap-3"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{suggestion}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={() => router.push('/onboarding/step-1')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-4">
          {subjects.length > 0 && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {subjects.length} topic{subjects.length !== 1 ? 's' : ''} ready
            </span>
          )}
          <Button
            onClick={handleNext}
            disabled={!isSubjectListValid(subjects) || loading}
            size="lg"
          >
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
    </div>
  )
}
