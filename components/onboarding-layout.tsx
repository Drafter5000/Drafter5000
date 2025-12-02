"use client"

import type React from "react"
import { Header } from "@/components/header"
import { CheckCircle2 } from "lucide-react"

interface OnboardingLayoutProps {
  children: React.ReactNode
  currentStep: number
  totalSteps?: number
}

const STEP_LABELS = ["Pick Your Style", "Choose Topics", "Set Delivery"]

export function OnboardingLayout({ children, currentStep, totalSteps = 3 }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Enhanced step indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        i + 1 < currentStep
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          : i + 1 === currentStep
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1 < currentStep ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        i + 1 <= currentStep ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {STEP_LABELS[i]}
                    </span>
                  </div>
                  {i < totalSteps - 1 && (
                    <div
                      className={`w-16 md:w-24 h-1 mx-2 rounded-full transition-colors ${
                        i + 1 < currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="animate-fade-up">{children}</div>
        </div>
      </main>
    </div>
  )
}
