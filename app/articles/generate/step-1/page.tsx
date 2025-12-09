'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Win95Button,
  Win95Textarea,
  Win95Tabs,
  Win95TabContent,
  Win95Progress,
  Win95Alert,
  Win95Badge,
} from '@/components/win95';
import { DraftSessionService } from '@/lib/draft-session';
import { isStyleSampleValid, countWords } from '@/lib/onboarding-validation';

/**
 * Step 1 - Writing Style (Anonymous Access)
 * Requirements: 1.2, 2.1, 2.3, 2.4
 */
export default function GenerateStep1Page() {
  const router = useRouter();
  const [articles, setArticles] = useState<string[]>(['', '', '']);
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draftSession = DraftSessionService.load();
    if (draftSession?.style_samples && draftSession.style_samples.length > 0) {
      setArticles([...draftSession.style_samples, '', '', ''].slice(0, 3));
    }
    setInitialLoading(false);
  }, []);

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

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const validArticles = articles.filter(a => a.trim());
      if (!isStyleSampleValid(validArticles)) {
        setError('Please add at least one article sample');
        setLoading(false);
        return;
      }

      DraftSessionService.save({
        style_samples: validArticles,
        current_step: 2,
      });

      router.push('/articles/generate/step-2');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save articles';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="text-center py-8">
        <span className="text-[11px] win95-loading">Loading...</span>
      </div>
    );
  }

  const tabs = [
    { value: '1', label: `Article 1 ${getArticleStatus(0).hasContent ? '✓' : ''}` },
    { value: '2', label: `Article 2 ${getArticleStatus(1).hasContent ? '✓' : ''}` },
    { value: '3', label: `Article 3 ${getArticleStatus(2).hasContent ? '✓' : ''}` },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-[32px] mb-2">📝</div>
        <h2 className="text-[14px] font-bold">Define Your Writing Style</h2>
        <p className="text-[11px] text-[var(--win95-button-shadow)]">
          Share up to 3 articles so our AI can learn your unique voice
        </p>
      </div>

      {/* Progress */}
      <div className="win95-sunken p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold">Progress</span>
          <span className="text-[11px]">{filledCount} of 3 articles</span>
        </div>
        <Win95Progress value={progressValue} />
        <div className="flex justify-between mt-2">
          {[1, 2, 3].map((num, index) => {
            const { hasContent } = getArticleStatus(index);
            return (
              <div key={num} className="flex items-center gap-1 text-[10px]">
                <span className={hasContent ? 'text-[var(--win95-success)]' : ''}>
                  {hasContent ? '✓' : '○'} Article {num}
                </span>
                {num === 1 && !hasContent && <Win95Badge variant="secondary">Required</Win95Badge>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <Win95Alert type="info">
        Paste articles you have written or content whose style you want to emulate. At least one
        article is required, but more samples improve accuracy.
      </Win95Alert>

      {error && (
        <Win95Alert type="error" title="Error">
          {error}
        </Win95Alert>
      )}

      {/* Tabs */}
      <Win95Tabs value={activeTab} onValueChange={setActiveTab} tabs={tabs}>
        {[1, 2, 3].map((num, index) => {
          const { hasContent, wordCount } = getArticleStatus(index);
          return (
            <Win95TabContent key={num} value={String(num)} activeValue={activeTab}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold">Article {num}</span>
                    <span className="text-[10px] text-[var(--win95-button-shadow)] ml-2">
                      {num === 1 ? 'Required to continue' : 'Optional - improves results'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasContent && <Win95Badge>{wordCount} words</Win95Badge>}
                    {num > 1 && <Win95Badge variant="outline">Optional</Win95Badge>}
                  </div>
                </div>

                <Win95Textarea
                  placeholder={`Paste your article here...\n\nThis could be a blog post, newsletter, essay, or any written content.`}
                  className="min-h-[200px]"
                  value={articles[index]}
                  onChange={e => updateArticle(index, e.target.value)}
                  disabled={loading}
                />

                <div className="flex items-center justify-between text-[10px]">
                  <div className="text-[var(--win95-button-shadow)]">
                    {wordCount} words | {articles[index].length} characters
                  </div>
                  {wordCount >= 100 && (
                    <span className="text-[var(--win95-success)]">✓ Good length</span>
                  )}
                </div>
              </div>
            </Win95TabContent>
          );
        })}
      </Win95Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--win95-button-shadow)]">
        <div className="text-[11px]">
          {hasAtLeastOneArticle ? (
            <span className="text-[var(--win95-success)]">✓ Ready to continue</span>
          ) : (
            <span className="text-[var(--win95-button-shadow)]">
              Add at least one article to continue
            </span>
          )}
        </div>

        <Win95Button
          onClick={handleSubmit}
          disabled={!hasAtLeastOneArticle || loading}
          size="lg"
          className={loading ? 'win95-loading' : ''}
        >
          {loading ? 'Saving...' : 'Continue →'}
        </Win95Button>
      </div>
    </div>
  );
}
