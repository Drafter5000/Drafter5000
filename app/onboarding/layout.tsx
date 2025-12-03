'use client'

import type React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { ChevronLeft, CheckCircle2, Lock, Loader2, LayoutDashboard } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface OnboardingProgress {
  style_samples: string[]
  subjects: string[]
  delivery_days: string[]
  completed_at: string | null
}

const STEPS = [
  { number: 1, title: 'Define Your Style', path: '/onboarding/step-1', shortTitle: 'Style' },
  { number: 2, title: 'Choose Topics', path: '/onboarding/step-2', shortTitle: 'Topics' },
  { number: 3, title: 'Delivery Settings', path: '/onboarding/step-3', shortTitle: 'Delivery' },
]

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  // Fetch onboarding progress
  const fetchProgress = useCallback(async () => {
    if (!user) return
    try {
      const data = await apiClient.get<OnboardingProgress>(
        `/onboarding/progress?user_id=${user.id}`
      )
      setProgress(data)
    } catch {
      // No progress yet, that's fine
      setProgress({ style_samples: [], subjects: [], delivery_days: [], completed_at: null })
    } finally {
      setLoading(false)
    }
  }, [user])

  // Refetch progress when pathname changes (user navigated to a new step)
  useEffect(() => {
    fetchProgress()
  }, [fetchProgress, pathname])

  useEffect(() => {
    const step = STEPS.findIndex(s => s.path === pathname)
    if (step !== currentStep) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }
    setCurrentStep(step >= 0 ? step : 0)
  }, [pathname, currentStep])

  // Check if a step is completed
  const isStepCompleted = (stepNumber: number): boolean => {
    if (!progress) return false
    switch (stepNumber) {
      case 1:
        return progress.style_samples.length > 0
      case 2:
        return progress.subjects.length > 0
      case 3:
        return progress.completed_at !== null
      default:
        return false
    }
  }

  // Check if a step is accessible
  const isStepAccessible = (stepNumber: number): boolean => {
    if (stepNumber === 1) return true
    // Can access step N if step N-1 is completed
    return isStepCompleted(stepNumber - 1)
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      router.push(STEPS[currentStep - 1].path)
    }
  }

  const navigateToStep = (stepIndex: number) => {
    const targetStep = STEPS[stepIndex]
    if (isStepAccessible(targetStep.number)) {
      router.push(targetStep.path)
    }
  }

  // Redirect if trying to access a locked step (only on initial load, not on navigation)
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    if (!loading && progress && !initialCheckDone) {
      setInitialCheckDone(true)
      const step = STEPS.findIndex(s => s.path === pathname)
      if (step >= 0 && !isStepAccessible(STEPS[step].number)) {
        // Find the highest accessible step
        let highestAccessible = 0
        for (let i = 0; i < STEPS.length; i++) {
          if (isStepAccessible(STEPS[i].number)) {
            highestAccessible = i
          } else {
            break
          }
        }
        router.push(STEPS[highestAccessible].path)
      }
    }
  }, [loading, progress, pathname, router, initialCheckDone])

  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your progress...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPreviousStep}
                    className="h-10 w-10 rounded-full hover:bg-primary/10 transition-all duration-200"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <div>
                  <h1 className="text-xl font-bold">{STEPS[currentStep]?.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {STEPS.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-primary">
                    {Math.round(progressPercentage)}%
                  </span>
                  <span>complete</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-border/30 bg-background/50 backdrop-blur-sm sticky top-[73px] z-30">
          <div className="max-w-4xl mx-auto px-6 py-4">
            {/* Progress Bar */}
            <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between">
              {STEPS.map((step, index) => {
                const isCompleted = isStepCompleted(step.number)
                const isActive = index === currentStep
                const isAccessible = isStepAccessible(step.number)

                return (
                  <button
                    key={step.number}
                    onClick={() => navigateToStep(index)}
                    disabled={!isAccessible}
                    className={`
                      group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300
                      ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                          : isCompleted
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:scale-102'
                            : isAccessible
                              ? 'bg-muted/80 text-muted-foreground hover:bg-muted hover:scale-102'
                              : 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                      }
                    `}
                  >
                    <div
                      className={`
                      h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold
                      transition-all duration-300
                      ${
                        isActive
                          ? 'bg-primary-foreground/20'
                          : isCompleted
                            ? 'bg-green-200 dark:bg-green-800'
                            : 'bg-background/50'
                      }
                    `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : !isAccessible ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span className="hidden sm:inline font-medium text-sm">{step.shortTitle}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content with Animation */}
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div
            className={`
              transition-all duration-300 ease-out
              ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
            `}
          >
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
