"use client"

import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { ChevronLeft, CheckCircle2 } from "lucide-react"

const STEPS = [
  { number: 1, title: "Define Your Style", path: "/onboarding/step-1" },
  { number: 2, title: "Choose Topics", path: "/onboarding/step-2" },
  { number: 3, title: "Delivery Settings", path: "/onboarding/step-3" },
]

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    const step = STEPS.findIndex((s) => s.path === pathname)
    setCurrentStep(step >= 0 ? step : 0)
  }, [pathname])

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      router.push(STEPS[currentStep - 1].path)
    }
  }

  const markStepComplete = (step: number) => {
    setCompletedSteps((prev) => [...new Set([...prev, step])])
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Get Started</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Step {currentStep + 1} of {STEPS.length}
                </p>
              </div>
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={goToPreviousStep} className="gap-2 bg-transparent">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="border-b border-border/30 bg-background/50 sticky top-16 z-30">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex gap-2">
              {STEPS.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <button
                    onClick={() => router.push(step.path)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                      index === currentStep
                        ? "bg-primary text-primary-foreground"
                        : index < currentStep
                          ? "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="h-5 w-5 flex items-center justify-center font-semibold text-xs">
                        {step.number}
                      </span>
                    )}
                    <span className="hidden sm:inline font-medium">{step.title}</span>
                  </button>
                  {index < STEPS.length - 1 && <div className="hidden md:block h-px w-8 bg-border/30 mx-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">{children}</div>
      </div>
    </ProtectedRoute>
  )
}
