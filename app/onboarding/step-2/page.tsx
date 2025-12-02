"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Sparkles, X, Loader2, Lightbulb, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"

const AI_SUGGESTIONS = [
  "The Future of Remote Work in 2025",
  "Building a Personal Brand Online",
  "Productivity Hacks That Actually Work",
  "The Art of Effective Communication",
  "Sustainable Living Tips for Beginners",
  "Mental Health in the Digital Age",
  "Investing Strategies for Millennials",
  "The Power of Habit Formation",
]

export default function Step2Page() {
  const router = useRouter()
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [aiActive, setAiActive] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addSubject = (subject: string) => {
    if (subject.trim() && !subjects.includes(subject.trim())) {
      setSubjects([...subjects, subject.trim()])
    }
    setInputValue("")
  }

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index))
  }

  const activateAI = () => {
    setLoading(true)
    setTimeout(() => {
      setAiActive(true)
      setAiSuggestions(AI_SUGGESTIONS)
      setLoading(false)
    }, 800)
  }

  const addFromAI = (suggestion: string) => {
    if (!subjects.includes(suggestion)) {
      setSubjects([...subjects, suggestion])
    }
    setAiSuggestions(aiSuggestions.filter((s) => s !== suggestion))
  }

  const handleNext = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      await apiClient.post("/onboarding/step-2", {
        user_id: user.id,
        subjects,
      })

      router.push("/onboarding/step-3")
    } catch (err: any) {
      setError(err.message || "Failed to save subjects")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-6">
          <Lightbulb className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Choose Topics</h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          Select subjects for your articles. One subject = one article per cycle
        </p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              Your Subjects
              {subjects.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  {subjects.length} added
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a subject..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addSubject(inputValue)
                  }
                }}
                className="h-12"
              />
              <Button onClick={() => addSubject(inputValue)} disabled={!inputValue.trim()} className="h-12 px-4">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <div className="min-h-[260px] max-h-[320px] overflow-y-auto space-y-2">
              {subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Lightbulb className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No subjects added yet</p>
                </div>
              ) : (
                subjects.map((subject, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl border bg-secondary/30 group hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-sm font-medium">{subject}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubject(index)}
                      className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Helper
            </CardTitle>
            {!aiActive && (
              <Button onClick={activateAI} size="sm" disabled={loading} className="shadow-lg shadow-primary/20">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Activate"
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!aiActive ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Activate to get AI suggestions</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {aiSuggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="h-6 w-6 text-primary mb-3" />
                    <p className="text-sm text-muted-foreground">All suggestions added!</p>
                  </div>
                ) : (
                  aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => addFromAI(suggestion)}
                      className="w-full text-left p-4 rounded-xl border-2 border-transparent bg-background hover:border-primary/30 hover:bg-primary/5 transition-all text-sm flex items-center gap-3 group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
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

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={() => router.push("/onboarding/step-1")}
          className="gap-2 border-2 h-12 px-6 bg-transparent"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={subjects.length === 0 || loading}
          className="gap-2 shadow-lg shadow-primary/20 h-12 px-8"
        >
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  )
}
