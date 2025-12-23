'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, Info, Briefcase } from 'lucide-react';
import { countWords, isStyleSampleValid } from '@/lib/onboarding-validation';

const CHARACTER_LIMIT = 2000;

interface StyleFormStep1ModernProps {
  initialArticles?: string[];
  initialJobTitle?: string;
  onSubmit: (articles: string[], jobTitle: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function StyleFormStep1Modern({
  initialArticles = ['', '', ''],
  initialJobTitle = '',
  onSubmit,
  loading = false,
  error = null,
}: StyleFormStep1ModernProps) {
  const [articles, setArticles] = useState([...initialArticles, '', '', ''].slice(0, 3));
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [activeTab, setActiveTab] = useState('1');

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
  const filledCount = articles.filter(a => a.trim().length > 0).length;

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

  const handleSubmit = () => {
    onSubmit(
      articles.filter(a => a.trim()),
      jobTitle
    );
  };

  // Determine if Continue button should show (for articles 1-3) or Submit (for job title)
  const currentTabNum = parseInt(activeTab);
  const isOnJobTitleTab = currentTabNum === 4;
  const canContinue = currentTabNum <= 3 && getArticleStatus(currentTabNum - 1).hasContent;

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Paste articles you have written or content whose style you want to emulate. All three
          articles should come from the same author to properly train the AI.
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
                        {wordCount} words
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
                      <p className="text-sm text-muted-foreground">Required to continue</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasContent && <Badge variant="secondary">{wordCount} words</Badge>}
                      {!hasContent && <Badge variant="destructive">Required</Badge>}
                    </div>
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
                      <span>
                        {charCount}/{CHARACTER_LIMIT} characters
                      </span>
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
        <div className="text-sm text-muted-foreground">
          {isComplete ? (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Ready to continue
            </span>
          ) : (
            `Add all three articles and job title to continue`
          )}
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
                Continue
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
