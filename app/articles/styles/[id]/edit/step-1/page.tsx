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
import { Progress } from '@/components/ui/progress';
import { Win95Button, Win95Textarea, Win95Badge, Win95Alert } from '@/components/win95';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Info,
  Circle,
} from 'lucide-react';
import { countWords, isStyleSampleValid } from '@/lib/onboarding-validation';

export default function EditStep1Page() {
  const router = useRouter();
  const params = useParams();
  const styleId = params.id as string;
  const editContext = useContext(EditStyleContext);
  const designContext = useContext(DesignContext);
  const designMode: DesignMode = designContext?.designMode ?? 'modern';

  const [articles, setArticles] = useState<string[]>(['', '', '']);
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize from style data
  useEffect(() => {
    if (editContext?.style && !initialized) {
      const samples = editContext.style.style_samples || [];
      setArticles([...samples, '', '', ''].slice(0, 3));
      setInitialized(true);
    }
  }, [editContext?.style, initialized]);

  const updateArticle = (index: number, value: string) => {
    const updated = [...articles];
    updated[index] = value;
    setArticles(updated);
  };

  const hasAllArticles = isStyleSampleValid(articles);
  const filledCount = articles.filter(a => a.trim().length > 0).length;
  const progressValue = (filledCount / 3) * 100;

  const getArticleStatus = (index: number) => {
    const hasContent = articles[index].trim().length > 0;
    const wordCount = countWords(articles[index]);
    return { hasContent, wordCount };
  };

  const handleSubmit = async () => {
    if (!hasAllArticles) {
      setError('Please add all 3 article samples to continue');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update the style in context
      editContext?.updateStyle({
        style_samples: articles.filter(a => a.trim()),
      });

      // Navigate to next step
      router.push(`/articles/styles/${styleId}/edit/step-2`);
    } catch (err) {
      setError('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  if (editContext?.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            Update your article samples to refine your writing style
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
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Win95Button onClick={handleSubmit} disabled={!hasAllArticles || loading}>
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{filledCount} of 3 articles</span>
          </div>
          <Progress value={progressValue} className="h-2" />
          <div className="flex justify-between mt-3">
            {[1, 2, 3].map((num, index) => {
              const { hasContent } = getArticleStatus(index);
              return (
                <div key={num} className="flex items-center gap-2 text-sm">
                  {hasContent ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={hasContent ? 'text-foreground' : 'text-muted-foreground'}>
                    Article {num}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
            </TabsList>
          </div>

          {[1, 2, 3].map((num, index) => {
            const { hasContent, wordCount } = getArticleStatus(index);
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
                    placeholder="Paste your article here..."
                    className="min-h-[280px] resize-none text-base leading-relaxed"
                    value={articles[index]}
                    onChange={e => updateArticle(index, e.target.value)}
                    disabled={loading}
                  />

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{wordCount} words</span>
                      <span>{articles[index].length} characters</span>
                    </div>
                    {wordCount >= 100 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Good length</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {hasAllArticles ? (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Ready to continue
            </span>
          ) : (
            'Add all three articles to continue'
          )}
        </div>

        <Button onClick={handleSubmit} disabled={!hasAllArticles || loading} size="lg">
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
      </div>
    </div>
  );
}
