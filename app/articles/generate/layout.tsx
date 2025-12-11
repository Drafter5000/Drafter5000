'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useContext } from 'react';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { Win95Window, Win95Progress, Win95Button } from '@/components/win95';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Monitor } from 'lucide-react';

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
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
  const toggleAndReload = context?.toggleAndReload;
  const currentStepIndex = STEPS.findIndex(s => pathname.startsWith(s.path));
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const progressValue = (currentStep / STEPS.length) * 100;

  // Win95 Design
  if (designMode === 'win95') {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto mb-4">
          <div className="win95-raised p-2 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-[16px]">✨</span>
              <span className="text-[12px] font-bold">Drafter</span>
            </Link>
            <div className="flex items-center gap-2">
              <Win95Button size="sm" onClick={toggleAndReload} title="Switch to Modern Design">
                🎨 Modern
              </Win95Button>
              <Link href="/login" className="text-[11px] text-[var(--win95-link)] underline">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Win95Window title="Create Article Style" icon={<span>📝</span>} showControls={true}>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold">Progress</span>
                <span className="text-[11px]">
                  Step {currentStep} of {STEPS.length}
                </span>
              </div>
              <Win95Progress value={progressValue} />

              <div className="flex justify-between mt-3">
                {STEPS.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div
                      key={step.path}
                      className={`flex items-center gap-1 text-[11px] ${
                        isCurrent
                          ? 'font-bold'
                          : isCompleted
                            ? 'text-[var(--win95-success)]'
                            : 'text-[var(--win95-button-shadow)]'
                      }`}
                    >
                      <span
                        className={`
                        w-4 h-4 flex items-center justify-center text-[10px]
                        ${isCompleted ? 'win95-sunken bg-[var(--win95-success)] text-white' : 'win95-sunken'}
                      `}
                      >
                        {isCompleted ? '✓' : step.number}
                      </span>
                      <span className="hidden sm:inline">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="win95-sunken p-4">{children}</div>
          </Win95Window>
        </div>
      </div>
    );
  }

  // Modern Design
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="font-bold text-lg">Drafter</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Win95 design toggle - temporarily hidden
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAndReload}
              title="Switch to Win95 Design"
            >
              <Monitor className="h-4 w-4 mr-1" />
              Win95
            </Button>
            */}
            <Link href="/login" className="text-sm text-primary hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />

          <div className="flex justify-between mt-4">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div
                  key={step.path}
                  className={`flex items-center gap-2 text-sm ${
                    isCurrent
                      ? 'font-semibold text-primary'
                      : isCompleted
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <span
                      className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs
                      ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                    `}
                    >
                      {step.number}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">{children}</div>
      </div>
    </div>
  );
}
