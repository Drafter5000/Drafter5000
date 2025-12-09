'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

const STEPS = [
  { path: '/articles/generate/step-1', label: 'Writing Style', number: 1 },
  { path: '/articles/generate/step-2', label: 'Topics', number: 2 },
  { path: '/articles/generate/step-3', label: 'Sign Up', number: 3 },
];

/**
 * Public onboarding layout - no authentication required
 * Requirements: 7.1, 8.1, 8.2
 */
export default function GenerateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStepIndex = STEPS.findIndex(s => pathname.startsWith(s.path));
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const progressValue = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Simple public header with logo only */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Drafter</span>
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Already have an account? Sign in
          </Link>
        </div>
      </header>

      <main className="pt-8 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Create Article Style</h1>
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </span>
            </div>
            <Progress value={progressValue} className="h-2 mb-4" />
            <div className="flex justify-between">
              {STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div
                    key={step.path}
                    className={`flex items-center gap-2 text-sm ${
                      isCurrent
                        ? 'text-primary font-medium'
                        : isCompleted
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className={`h-4 w-4 ${isCurrent ? 'fill-primary/20' : ''}`} />
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.number}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
