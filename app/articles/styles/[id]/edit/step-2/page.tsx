'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { EditStyleContext } from '../layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Win95Button, Win95Input, Win95Badge, Win95Alert } from '@/components/win95';
import {
  Lightbulb,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Save,
  Lock,
} from 'lucide-react';
import { isSubjectValid, isSubjectListValid } from '@/lib/onboarding-validation';
import { apiClient } from '@/lib/api-client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TopicWithStatus {
  topic: string;
  status: string;
}

export default function EditStep2Page() {
  const router = useRouter();
  const params = useParams();
  const styleId = params.id as string;
  const { user } = useAuth();
  const editContext = useContext(EditStyleContext);
  const designContext = useContext(DesignContext);
  const designMode: DesignMode = designContext?.designMode ?? 'modern';

  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Track topics with their statuses (to know which are generated/sent)
  const [topicsWithStatus, setTopicsWithStatus] = useState<TopicWithStatus[]>([]);

  // AI suggestions state
  const [aiActive, setAiActive] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  // Track all AI-generated topics during this session (includes added and ignored)
  const [generatedTopicsHistory, setGeneratedTopicsHistory] = useState<string[]>([]);

  // Fetch topics with status from API
  useEffect(() => {
    const fetchTopicsWithStatus = async () => {
      try {
        const response = await apiClient.get<{ topics: TopicWithStatus[] }>('/topics');
        setTopicsWithStatus(response.topics || []);
      } catch (err) {
        console.error('Failed to fetch topics with status:', err);
      }
    };
    fetchTopicsWithStatus();
  }, []);

  // Check if a topic is generated (has "Sent" status)
  const isTopicGenerated = (subject: string): boolean => {
    const topicData = topicsWithStatus.find(t => t.topic.toLowerCase() === subject.toLowerCase());
    return topicData?.status?.toLowerCase() === 'sent';
  };

  // Initialize from style data
  useEffect(() => {
    if (editContext?.style && !initialized) {
      setSubjects(editContext.style.subjects || []);
      setInitialized(true);
    }
  }, [editContext?.style, initialized]);

  const addSubject = (subject: string) => {
    if (isSubjectValid(subject, subjects)) {
      setSubjects([...subjects, subject.trim()]);
    }
    setSubjectInput('');
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const generateAISuggestions = async () => {
    if (!user || !editContext?.style?.style_samples?.length) {
      setAiError('No style samples available. Please complete step 1 first.');
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const response = await apiClient.post<{ suggestions: string[] }>('/ai/suggestions', {
        user_id: user.id,
        chosen_topics: subjects,
        generated_topics_history: generatedTopicsHistory,
        style_samples: editContext.style.style_samples,
      });

      const newSuggestions = response.suggestions || [];
      setAiActive(true);
      setAiSuggestions(newSuggestions);
      // Add new suggestions to history
      setGeneratedTopicsHistory(prev => [...new Set([...prev, ...newSuggestions])]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate suggestions';
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const refreshSuggestions = () => {
    generateAISuggestions();
  };

  const addFromAI = (suggestion: string) => {
    if (isSubjectValid(suggestion, subjects)) {
      setSubjects([...subjects, suggestion]);
      setAiSuggestions(aiSuggestions.filter(s => s !== suggestion));
    }
  };

  const handleSubmit = async () => {
    if (!isSubjectListValid(subjects)) {
      setError('Please add at least one topic');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update the style in context
      editContext?.updateStyle({ subjects });

      // Navigate to next step, preserving returnTo param
      const returnTo = editContext?.returnTo;
      const nextUrl = `/articles/styles/${styleId}/edit/step-3${returnTo && returnTo !== `/articles/styles/${styleId}` ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;
      router.push(nextUrl);
    } catch (err) {
      setError('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Save current state before going back
    editContext?.updateStyle({ subjects });
    const returnTo = editContext?.returnTo;
    const backUrl = `/articles/styles/${styleId}/edit/step-1${returnTo && returnTo !== `/articles/styles/${styleId}` ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;
    router.push(backUrl);
  };

  // Save changes and exit without going through all steps
  const handleSaveAndExit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare the updated data
      const updatedData = { subjects };

      // Update the style in context
      editContext?.updateStyle(updatedData);

      // Save and redirect back to origin - pass the data directly to avoid async state issues
      await editContext?.saveAndExit(updatedData);
    } catch (err) {
      console.error('Failed to save style:', err);
      setError('Failed to save changes');
      setLoading(false);
    }
  };

  if (editContext?.loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>

        {/* Two Column Grid Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Your Topics Card Skeleton */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ opacity: 1 - i * 0.2 }}
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions Card Skeleton */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
              <Skeleton className="h-4 w-56 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10">
                <Skeleton className="h-12 w-12 rounded-full mb-3" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-11 w-36 rounded-md" />
        </div>
      </div>
    );
  }

  const isValid = isSubjectListValid(subjects);

  // Win95 Design
  if (designMode === 'win95') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-[32px] mb-2">💡</div>
          <h2 className="text-[14px] font-bold">Edit Topics</h2>
          <p className="text-[11px] text-[var(--win95-button-shadow)]">
            Update the subjects you want to write about
          </p>
        </div>

        {error && (
          <Win95Alert type="error" title="Error">
            {error}
          </Win95Alert>
        )}

        <div className="flex gap-2">
          <Win95Input
            placeholder="Enter a topic..."
            value={subjectInput}
            onChange={e => setSubjectInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSubject(subjectInput);
              }
            }}
            disabled={loading}
            className="flex-1"
          />
          <Win95Button
            onClick={() => addSubject(subjectInput)}
            disabled={!subjectInput.trim() || loading}
            size="sm"
          >
            Add
          </Win95Button>
        </div>

        {/* AI Suggestions for Win95 */}
        <div className="win95-field p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold">✨ Get Ideas (AI)</span>
            <Win95Button onClick={generateAISuggestions} disabled={aiLoading || loading} size="sm">
              {aiLoading ? 'Loading...' : aiActive ? 'Refresh' : 'Generate'}
            </Win95Button>
          </div>
          {aiError && (
            <Win95Alert type="error" title="Error">
              {aiError}
            </Win95Alert>
          )}
          {aiActive && aiSuggestions.length > 0 && (
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {aiSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-1 win95-raised cursor-pointer hover:bg-[var(--win95-button-face)]"
                  onClick={() => addFromAI(suggestion)}
                >
                  <span className="text-[10px] truncate flex-1">{suggestion}</span>
                  <Win95Badge variant="outline">+</Win95Badge>
                </div>
              ))}
            </div>
          )}
          {aiActive && aiSuggestions.length === 0 && !aiLoading && (
            <div className="text-center py-2 text-[10px] text-[var(--win95-button-shadow)]">
              All suggestions added! Click Refresh for more.
            </div>
          )}
          {!aiActive && !aiLoading && (
            <div className="text-center py-2 text-[10px] text-[var(--win95-button-shadow)]">
              Click Generate to get AI-powered topic ideas
            </div>
          )}
        </div>

        <div className="win95-field min-h-[150px] max-h-[300px] overflow-y-auto p-2">
          {subjects.length === 0 ? (
            <div className="text-center py-4 text-[10px] text-[var(--win95-button-shadow)]">
              No topics added yet
            </div>
          ) : (
            <div className="space-y-1">
              {subjects.map((subject, index) => {
                const isGenerated = isTopicGenerated(subject);
                return (
                  <div key={index} className="flex items-center justify-between p-2 win95-raised">
                    <div className="flex items-center gap-2">
                      <Win95Badge variant="outline">{index + 1}</Win95Badge>
                      <span className="text-[11px]">{subject}</span>
                      {isGenerated && <Win95Badge variant="outline">🔒 Generated</Win95Badge>}
                    </div>
                    {!isGenerated && (
                      <Win95Button
                        onClick={() => removeSubject(index)}
                        size="sm"
                        disabled={loading}
                      >
                        ×
                      </Win95Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Win95Button onClick={handleBack} disabled={loading}>
            ← Back
          </Win95Button>
          <div className="flex gap-2">
            <Win95Button onClick={handleSaveAndExit} disabled={loading || editContext?.saving}>
              {editContext?.saving ? 'Saving...' : '💾 Save & Exit'}
            </Win95Button>
            <Win95Button onClick={handleSubmit} disabled={!isValid || loading}>
              {loading ? 'Saving...' : 'Next: Settings →'}
            </Win95Button>
          </div>
        </div>
      </div>
    );
  }

  // Modern Design
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Edit Topics</h2>
        <p className="text-muted-foreground">Update the subjects you want to write about</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Your Topics Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Your Topics
              </CardTitle>
              {subjects.length > 0 && <Badge variant="secondary">{subjects.length} added</Badge>}
            </div>
            <CardDescription>
              Each topic will become an article. Add, remove, or reorder as needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a topic..."
                value={subjectInput}
                onChange={e => setSubjectInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubject(subjectInput);
                  }
                }}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={() => addSubject(subjectInput)}
                disabled={!subjectInput.trim() || loading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {subjects.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <Lightbulb className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No topics added yet</p>
                <p className="text-sm text-muted-foreground">Add your first topic above</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {subjects.map((subject, index) => {
                  const isGenerated = isTopicGenerated(subject);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/30 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {index + 1}
                        </Badge>
                        <span className="font-medium text-sm">{subject}</span>
                        {isGenerated && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Lock className="h-3 w-3" />
                            Generated
                          </Badge>
                        )}
                      </div>
                      {isGenerated ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-8 w-8 flex items-center justify-center text-muted-foreground">
                              <Lock className="h-4 w-4" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Generated topics cannot be removed</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeSubject(index)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {subjects.length > 0 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <p className="text-sm text-muted-foreground">
                  {subjects.length} topic{subjects.length !== 1 ? 's' : ''} ready
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Get Ideas (AI) Card */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Get Ideas
              </CardTitle>
              <div className="flex items-center gap-2">
                {aiActive && (
                  <Button
                    onClick={refreshSuggestions}
                    size="sm"
                    variant="outline"
                    disabled={aiLoading || loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                {!aiActive && (
                  <Button onClick={generateAISuggestions} size="sm" disabled={aiLoading || loading}>
                    {aiLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      'Generate Ideas'
                    )}
                  </Button>
                )}
              </div>
            </div>
            <CardDescription>
              {aiActive ? (
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Generated by AI — Click a suggestion to add it
                </span>
              ) : (
                'Get AI-powered topic ideas based on your writing style'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aiError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}
            {!aiActive ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {aiLoading ? 'Analyzing your writing style...' : 'Need inspiration?'}
                </p>
                {aiLoading && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Our AI is reading your articles to suggest relevant topics
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                    <p className="text-sm text-muted-foreground">Generating new ideas...</p>
                  </div>
                ) : aiSuggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Sparkles className="h-6 w-6 text-primary mb-3" />
                    <p className="text-sm font-medium text-primary">All suggestions added!</p>
                    <Button
                      onClick={refreshSuggestions}
                      size="sm"
                      variant="outline"
                      className="mt-3"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Get More Ideas
                    </Button>
                  </div>
                ) : (
                  aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => addFromAI(suggestion)}
                      disabled={loading}
                      className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-colors text-sm flex items-center gap-3 disabled:opacity-50"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{suggestion}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={handleBack} disabled={loading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSaveAndExit}
            disabled={loading || editContext?.saving}
            size="lg"
          >
            {editContext?.saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save & Exit
              </>
            )}
          </Button>

          <Button onClick={handleSubmit} disabled={!isValid || loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                Next: Settings
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
