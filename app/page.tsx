import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles, Clock, Target, Zap, Shield, BarChart3 } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <section className="py-24 md:py-32 px-6 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-sm font-medium border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>AI-Powered Writing Assistant</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.1]">
                  Articles that sound like <span className="text-primary">you wrote them</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                  Train our AI on your writing style, pick your topics, and receive professionally written articles
                  delivered straight to your inbox.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link href="/onboarding/step-1">
                    <Button size="lg" className="gap-2 shadow-xl shadow-primary/25 text-base px-8 h-12">
                      Get Started Free <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline" className="border-2 text-base px-8 h-12 bg-transparent">
                      View Pricing
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Setup in 3 minutes</span>
                  </div>
                </div>
              </div>

              {/* Enhanced hero visual */}
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl border-2 border-border bg-card p-8 shadow-2xl shadow-primary/5 relative overflow-hidden">
                  <div className="absolute top-4 left-4 flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-chart-4/60" />
                    <div className="h-3 w-3 rounded-full bg-chart-1/60" />
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="h-5 bg-foreground/10 rounded-lg w-3/4 animate-shimmer" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="mt-6 h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xl shadow-primary/30 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Your Style
                </div>
                <div className="absolute -bottom-4 -left-4 bg-card border-2 border-border px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Articles Generated</p>
                    <p className="font-bold">12,847</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 bg-secondary/30 border-y border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Three simple steps to get personalized articles delivered to your inbox
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  step: "01",
                  title: "Define Your Style",
                  description: "Paste sample articles and our AI learns your unique voice, tone, and writing patterns.",
                },
                {
                  icon: Sparkles,
                  step: "02",
                  title: "Choose Topics",
                  description: "Get intelligent topic suggestions or add your own subjects for personalized content.",
                },
                {
                  icon: Clock,
                  step: "03",
                  title: "Set Your Schedule",
                  description: "Choose which days you want fresh articles delivered straight to your inbox.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="text-4xl font-bold text-muted/30">{feature.step}</span>
                  </div>
                  <h3 className="font-semibold text-xl mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your content creation?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of writers who are already saving time and creating better content with WriteAI.
            </p>
            <Link href="/onboarding/step-1">
              <Button size="lg" className="gap-2 shadow-xl shadow-primary/25 text-base px-10 h-14">
                Start Writing Today <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
