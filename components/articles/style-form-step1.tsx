'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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

interface StyleFormStep1Props {
  initialArticles?: string[];
  onSubmit: (articles: string[]) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function StyleFormStep1({
  initialArticles = ['', '', ''],
  onSubmit,
  loading = false,
  error = null,
}: StyleFormStep1Props) {
  const [articles, setArticles] = useState([...initialArticles, '', '', ''].slice(0, 3));
  const [activeTab, setActiveTab] = useState('1');

  const updateArticle = (index: number, value: string) => {
    const updated = [...articles];
    updated[index] = value;
    setArticles(updated);
  };

  const hasAtLeastOneArticle = isStyleSampleValid(articles);
  const filledCount = articles.filter(a => a.trim().length > 0).length;
  const progressValue = (filledCount / 3) * 100;

  const getArticleStatus = (index: number) => {
    const hasContent = articles[index].trim().length > 0;
    const wordCount = countWords(articles[index]);
    return { hasContent, wordCount };
  };

  const handleSubmit = () => {
    onSubmit(articles.filter(a => a.trim()));
  };

  return (
    <div className="space-y-6">
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
                  {num === 1 && !hasContent && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Paste articles you have written or content whose style you want to emulate. At least one
          article is required, but more samples improve accuracy.
        </AlertDescription>
      </Alert>

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
                      <p className="text-sm text-muted-foreground">
                        {num === 1 ? 'Required to continue' : 'Optional - improves results'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasContent && <Badge variant="secondary">{wordCount} words</Badge>}
                      {num > 1 && <Badge variant="outline">Optional</Badge>}
                    </div>
                  </div>

                  <Textarea
                    placeholder={`Paste your article here...\n\nThis could be a blog post, newsletter, essay, or any written content.`}
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
          {hasAtLeastOneArticle ? (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Ready to continue
            </span>
          ) : (
            'Add at least one article to continue'
          )}
        </div>

        <Button onClick={handleSubmit} disabled={!hasAtLeastOneArticle || loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
