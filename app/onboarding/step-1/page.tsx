"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function Step1Page() {
  const router = useRouter()
  const { user } = useAuth()
  const [articles, setArticles] = useState(["", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateArticle = (index: number, value: string) => {
    const updated = [...articles]
    updated[index] = value
    setArticles(updated)
  }

  const hasAtLeastOneArticle = articles.some((a) => a.trim().length > 0)
  const filledCount = articles.filter((a) => a.trim().length > 0).length

  const handleNext = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      // Save to Supabase
      await apiClient.post("/onboarding/step-1", {
        user_id: user.id,
        style_samples: articles.filter((a) => a.trim()),
      })

      router.push("/onboarding/step-2")
    } catch (err: any) {
      setError(err.message || "Failed to save articles")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-6">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Define Your Style</h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          Share 3 articles you've written (or whose style you want to emulate) so our AI can learn your unique voice
        </p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((num, index) => (
          <Card
            key={num}
            className={`p-6 border-2 transition-all duration-300 ${
              articles[index].trim()
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card hover:border-primary/20"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <Label htmlFor={`article-${num}`} className="text-sm font-semibold flex items-center gap-2">
                Article {num}
                {articles[index].trim() && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </Label>
              {articles[index].trim() && (
                <span className="text-xs text-muted-foreground">
                  {articles[index].split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </div>
            <Textarea
              id={`article-${num}`}
              placeholder={`Paste article ${num} here...`}
              className="min-h-[280px] resize-none bg-background border-border focus:border-primary transition-colors"
              value={articles[index]}
              onChange={(e) => updateArticle(index, e.target.value)}
            />
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filledCount}</span> of 3 articles added
        </div>
        <Button
          onClick={handleNext}
          disabled={!hasAtLeastOneArticle || loading}
          className="gap-2 shadow-lg shadow-primary/20 px-8 h-12"
          size="lg"
        >
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  )
}
