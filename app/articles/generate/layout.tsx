'use client';

import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

const STEPS = [
  { path: '/articles/generate/step-1', label: 'Writing Style', number: 1 },
  { path: '/articles/generate/step-2', label: 'Topics', number: 2 },
  { path: '/articles/generate/step-3', label: 'Settings', number: 3 },
];

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStepIndex = STEPS.findIndex(s => pathname.startsWith(s.path));
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const progressValue = (currentStep / STEPS.length) * 100;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
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
    </ProtectedRoute>
  );
}
