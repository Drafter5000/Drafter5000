'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Win95Window, Win95Progress } from '@/components/win95';

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
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-4">
        <div className="win95-raised p-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[16px]">✨</span>
            <span className="text-[12px] font-bold">Drafter</span>
          </Link>
          <Link href="/login" className="text-[11px] text-[var(--win95-link)] underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>

      {/* Main Window */}
      <div className="max-w-4xl mx-auto">
        <Win95Window title="Create Article Style" icon={<span>📝</span>} showControls={true}>
          {/* Progress Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold">Progress</span>
              <span className="text-[11px]">
                Step {currentStep} of {STEPS.length}
              </span>
            </div>
            <Win95Progress value={progressValue} />

            {/* Step indicators */}
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

          {/* Content */}
          <div className="win95-sunken p-4">{children}</div>
        </Win95Window>
      </div>
    </div>
  );
}
