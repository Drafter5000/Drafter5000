'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { EditStyleContext } from '../layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Win95Button, Win95Textarea, Win95Badge, Win95Alert } from '@/components/win95';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Save,
  Briefcase,
} from 'lucide-react';
import { countWords, isStyleSampleValid } from '@/lib/onboarding-validation';

const CHARACTER_LIMIT = 2000;

export default function EditStep1Page() {
  const router = useRouter();
  const params = useParams();
  const styleId = params.id as string;
  const editContext = useContext(EditStyleContext);
  const designContext = useContext(DesignContext);
  const designMode: DesignMode = designContext?.designMode ?? 'modern';

  const [articles, setArticles] = useState<string[]>(['', '', '']);
  const [jobTitle, setJobTitle] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize from style data and user profile job
  useEffect(() => {
    if (editContext?.style && !initialized) {
      const samples = editContext.style.style_samples || [];
      setArticles([...samples, '', '', ''].slice(0, 3));
      // Job comes from user profile, not article_styles
      setJobTitle(editContext.job || '');
      setInitialized(true);
    }
  }, [editContext?.style, editContext?.job, initialized]);

  const updateArticle = (index: number, value: string) => {
    // Enforce character limit
    if (value.length > CHARACTER_LIMIT) {
      value = value.slice(0, CHARACTER_LIMIT);
    }
    const updated = [...articles];
    updated[index] = value;
    setArticles(updated);
  };

  const hasAllArticles = isStyleSampleValid(articles);
  const hasJobTitle = jobTitle.trim().length > 0;
  const isComplete = hasAllArticles && hasJobTitle;

  const getArticleStatus = (index: number) => {
    const hasContent = articles[index].trim().length > 0;
    const wordCount = countWords(articles[index]);
    const charCount = articles[index].length;
    return { hasContent, wordCount, charCount };
  };

  const handleContinue = () => {
    const currentTabNum = parseInt(activeTab);
    if (currentTabNum < 4) {
      setActiveTab(String(currentTabNum + 1));
    }
  };

  // Determine if Continue button should show (for articles 1-3) or Next (for job title)
  const currentTabNum = parseInt(activeTab);
  const isOnJobTitleTab = currentTabNum === 4;
  const canContinue = currentTabNum <= 3 && getArticleStatus(currentTabNum - 1).hasContent;

  const handleSubmit = async () => {
    if (!isComplete) {
      setError('Please add all 3 article samples and job title to continue');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update the style in context (articles only, job is separate)
      editContext?.updateStyle({
        style_samples: articles.filter(a => a.trim()),
      });
      // Update job separately (stored in user_profiles)
      editContext?.updateJob(jobTitle.trim());

      // Navigate to next step, preserving returnTo param
      const returnTo = editContext?.returnTo;
      const nextUrl = `/articles/styles/${styleId}/edit/step-2${returnTo && returnTo !== `/articles/styles/${styleId}` ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;
      router.push(nextUrl);
    } catch (err) {
      setError('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  // Save changes and exit without going through all steps
  const handleSaveAndExit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare the updated style data (articles only)
      const updatedStyleData = {
        style_samples: articles.filter(a => a.trim()),
      };
      const updatedJob = jobTitle.trim();

      // Update the style and job in context
      editContext?.updateStyle(updatedStyleData);
      editContext?.updateJob(updatedJob);

      // Save and redirect back to origin - pass the data directly to avoid async state issues
      await editContext?.saveAndExit(updatedStyleData, updatedJob);
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
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>

        {/* Tabs Skeleton */}
        <Card>
          <div className="px-6 pt-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(num => (
                <Skeleton key={num} className="h-10 w-28 rounded-md" />
              ))}
            </div>
          </div>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-[280px] w-full rounded-md" />
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-11 w-32 rounded-md" />
        </div>
      </div>
    );
  }

  // Win95 Design
  if (designMode === 'win95') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-[32px] mb-2">📝</div>
          <h2 className="text-[14px] font-bold">Edit Writing Samples</h2>
          <p className="text-[11px] text-[var(--win95-button-shadow)]">
            Update your article samples and job title
          </p>
        </div>

        {error && (
          <Win95Alert type="error" title="Error">
            {error}
          </Win95Alert>
        )}

        <div className="space-y-3">
          {[0, 1, 2].map(index => {
            const { hasContent, wordCount } = getArticleStatus(index);
            return (
              <div key={index} className="win95-sunken p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold">Article {index + 1}</span>
                  {hasContent && <Win95Badge>{wordCount} words</Win95Badge>}
                </div>
                <Win95Textarea
                  placeholder="Paste your article here..."
                  className="min-h-[100px]"
                  value={articles[index]}
                  onChange={e => updateArticle(index, e.target.value)}
                  disabled={loading}
                  maxLength={CHARACTER_LIMIT}
                />
              </div>
            );
          })}

          {/* Job Title Field */}
          <div className="win95-sunken p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold">💼 Job Title</span>
              {hasJobTitle && (
                <Win95Badge>{jobTitle.split(/\s+/).filter(w => w).length} words</Win95Badge>
              )}
            </div>
            <Win95Textarea
              placeholder="Enter your job title (e.g., CEO of a tech startup)"
              className="min-h-[60px]"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Win95Button onClick={handleSaveAndExit} disabled={loading || editContext?.saving}>
            {editContext?.saving ? 'Saving...' : '💾 Save & Exit'}
          </Win95Button>
          <Win95Button onClick={handleSubmit} disabled={!isComplete || loading}>
            {loading ? 'Saving...' : 'Next: Topics →'}
          </Win95Button>
        </div>
      </div>
    );
  }

  // Modern Design
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Edit Writing Samples</h2>
        <p className="text-muted-foreground">
          Update your article samples to refine your writing style
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4">
            <TabsList>
              {[1, 2, 3].map((num, index) => {
                const { hasContent, wordCount } = getArticleStatus(index);
                return (
                  <TabsTrigger key={num} value={String(num)} className="gap-2 cursor-pointer">
                    {hasContent ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="h-5 w-5 rounded-full bg-muted text-xs flex items-center justify-center">
                        {num}
                      </span>
                    )}
                    <span className="hidden sm:inline">Article {num}</span>
                    {hasContent && (
                      <Badge variant="outline" className="text-xs hidden md:inline-flex">
                        {wordCount}w
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
              {/* Job Title Tab */}
              <TabsTrigger value="4" className="gap-2 cursor-pointer">
                {hasJobTitle ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="h-5 w-5 rounded-full bg-muted text-xs flex items-center justify-center">
                    4
                  </span>
                )}
                <span className="hidden sm:inline">Job Title</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {[1, 2, 3].map((num, index) => {
            const { hasContent, wordCount, charCount } = getArticleStatus(index);
            return (
              <TabsContent key={num} value={String(num)} className="mt-0">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Article {num}</h3>
                      <p className="text-sm text-muted-foreground">Required for style analysis</p>
                    </div>
                    {hasContent && <Badge variant="secondary">{wordCount} words</Badge>}
                  </div>

                  <Textarea
                    placeholder={`Paste your article here...\n\nThis could be a blog post, newsletter, essay, or any written content.`}
                    className="min-h-[280px] resize-none text-base leading-relaxed"
                    value={articles[index]}
                    onChange={e => updateArticle(index, e.target.value)}
                    disabled={loading}
                    maxLength={CHARACTER_LIMIT}
                  />

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{wordCount} words</span>
                      <span>{charCount} characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {charCount >= CHARACTER_LIMIT && (
                        <span className="text-amber-600 text-xs">Character limit reached</span>
                      )}
                      {wordCount >= 100 && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Good length</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </TabsContent>
            );
          })}

          {/* Job Title Tab Content */}
          <TabsContent value="4" className="mt-0">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    AI's Job Title
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    What job do you want your drafting AI to incarnate
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {hasJobTitle && (
                    <Badge variant="secondary">
                      {jobTitle.split(/\s+/).filter(w => w).length} words
                    </Badge>
                  )}
                </div>
              </div>

              <Textarea
                placeholder={`Enter your job title here...\n\nExamples:\n"Chief Technology Officer of a tech startup"\n"CEO of a mining company"\n"Chief Revenue Officer of an insurance company"`}
                className="min-h-[280px] resize-none text-base leading-relaxed"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                disabled={loading}
              />

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{jobTitle.split(/\s+/).filter(w => w).length} words</span>
                  <span>{jobTitle.length} characters</span>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="flex items-center justify-between pt-4">
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
          <div className="text-sm text-muted-foreground hidden sm:block">
            {isComplete ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Ready to continue
              </span>
            ) : (
              'Add all three articles and job title to continue'
            )}
          </div>
        </div>

        {isOnJobTitleTab ? (
          <Button onClick={handleSubmit} disabled={!isComplete || loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                Next: Topics
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleContinue} disabled={!canContinue || loading} size="lg">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
