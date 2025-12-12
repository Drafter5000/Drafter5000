'use client';

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { Win95Window, Win95Progress, Win95Button } from '@/components/win95';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import type { ArticleStyle } from '@/lib/types';

interface EditStyleContextValue {
  style: ArticleStyle | null;
  loading: boolean;
  updateStyle: (updates: Partial<ArticleStyle>) => void;
  saveStyle: () => Promise<void>;
  saving: boolean;
}

export const EditStyleContext = createContext<EditStyleContextValue | null>(null);

const STEPS = [
  { path: 'step-1', label: 'Writing Samples', number: 1 },
  { path: 'step-2', label: 'Topics', number: 2 },
  { path: 'step-3', label: 'Settings', number: 3 },
];

export default function EditStyleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const styleId = params.id as string;
  const { user } = useAuth();
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';

  const [style, setStyle] = useState<ArticleStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Determine current step from pathname
  const currentStepIndex = STEPS.findIndex(s => pathname.includes(s.path));
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const progressValue = (currentStep / STEPS.length) * 100;

  useEffect(() => {
    const fetchStyle = async () => {
      if (!user) return;
      try {
        const data = await apiClient.get<ArticleStyle>(
          `/article-styles/${styleId}?user_id=${user.id}`
        );
        setStyle(data);
      } catch (err) {
        console.error('Failed to fetch style:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStyle();
  }, [user, styleId]);

  const updateStyle = (updates: Partial<ArticleStyle>) => {
    if (style) {
      setStyle({ ...style, ...updates });
    }
  };

  const saveStyle = async () => {
    if (!user || !style) return;
    setSaving(true);
    try {
      await apiClient.put(`/article-styles/${styleId}`, {
        user_id: user.id,
        name: style.name,
        email: style.email,
        display_name: style.display_name,
        preferred_language: style.preferred_language,
        delivery_days: style.delivery_days,
        style_samples: style.style_samples,
        subjects: style.subjects,
      });
    } finally {
      setSaving(false);
    }
  };

  const contextValue: EditStyleContextValue = {
    style,
    loading,
    updateStyle,
    saveStyle,
    saving,
  };

  // Win95 Design
  if (designMode === 'win95') {
    return (
      <ProtectedRoute>
        <EditStyleContext.Provider value={contextValue}>
          <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto">
              <DashboardHeader />
              <Win95Window
                title={style ? `Edit: ${style.name}` : 'Edit Style'}
                icon={<span>✏️</span>}
              >
                {loading ? (
                  <div className="text-center py-8">
                    <span className="text-[11px] win95-loading">Loading style...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Link href={`/articles/styles/${styleId}`}>
                        <Win95Button size="sm">← Back to Style</Win95Button>
                      </Link>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold">Edit Progress</span>
                        <span className="text-[11px]">
                          Step {currentStep} of {STEPS.length}
                        </span>
                      </div>
                      <Win95Progress value={progressValue} />

                      <div className="flex justify-between mt-3">
                        {STEPS.map((step, index) => {
                          const isCompleted = index < currentStepIndex;
                          const isCurrent = index === currentStepIndex;
                          const stepPath = `/articles/styles/${styleId}/edit/${step.path}`;
                          return (
                            <Link key={step.path} href={stepPath}>
                              <div
                                className={`flex items-center gap-1 text-[11px] cursor-pointer hover:underline ${
                                  isCurrent
                                    ? 'font-bold'
                                    : isCompleted
                                      ? 'text-[var(--win95-success)]'
                                      : 'text-[var(--win95-button-shadow)]'
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 flex items-center justify-center text-[10px] ${
                                    isCompleted
                                      ? 'win95-sunken bg-[var(--win95-success)] text-white'
                                      : 'win95-sunken'
                                  }`}
                                >
                                  {isCompleted ? '✓' : step.number}
                                </span>
                                <span className="hidden sm:inline">{step.label}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    <div className="win95-sunken p-4">{children}</div>
                  </div>
                )}
              </Win95Window>
            </div>
          </div>
        </EditStyleContext.Provider>
      </ProtectedRoute>
    );
  }

  // Modern Design
  return (
    <ProtectedRoute>
      <EditStyleContext.Provider value={contextValue}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <DashboardHeader />

          <main className="pt-8 pb-20 px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              {loading ? (
                <div className="space-y-6">
                  {/* Header Skeleton */}
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-7 w-48" />
                    </div>
                  </div>

                  {/* Progress Skeleton */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <div className="flex justify-between">
                      {[1, 2, 3].map(num => (
                        <div key={num} className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-4 w-24 hidden sm:block" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Skeleton */}
                  <div className="bg-card rounded-lg border p-6 space-y-6">
                    <div className="text-center space-y-4">
                      <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                      <Skeleton className="h-8 w-56 mx-auto" />
                      <Skeleton className="h-5 w-72 mx-auto" />
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-48 w-full rounded-lg" />
                      <div className="flex justify-between">
                        <Skeleton className="h-10 w-24 rounded-md" />
                        <Skeleton className="h-10 w-32 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <Link href={`/articles/styles/${styleId}`}>
                      <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    </Link>
                    <div>
                      <p className="text-sm font-medium text-primary">Edit Style</p>
                      <h1 className="text-2xl font-bold tracking-tight">
                        {style?.name || 'Loading...'}
                      </h1>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        Step {currentStep} of {STEPS.length}
                      </span>
                    </div>
                    <Progress value={progressValue} className="h-2" />

                    <div className="flex justify-between">
                      {STEPS.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const stepPath = `/articles/styles/${styleId}/edit/${step.path}`;
                        return (
                          <Link key={step.path} href={stepPath}>
                            <div
                              className={`flex items-center gap-2 text-sm cursor-pointer hover:opacity-80 transition-opacity ${
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
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                  }`}
                                >
                                  {step.number}
                                </span>
                              )}
                              <span className="hidden sm:inline">{step.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-card rounded-lg border p-6">{children}</div>
                </div>
              )}
            </div>
          </main>
        </div>
      </EditStyleContext.Provider>
    </ProtectedRoute>
  );
}
