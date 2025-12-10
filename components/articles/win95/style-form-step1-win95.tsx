'use client';

import { useState } from 'react';
import {
  Win95Window,
  Win95Button,
  Win95Textarea,
  Win95Tabs,
  Win95TabContent,
  Win95Progress,
  Win95Badge,
  Win95Alert,
} from '@/components/win95';
import { countWords, isStyleSampleValid } from '@/lib/onboarding-validation';

interface StyleFormStep1Win95Props {
  initialArticles?: string[];
  onSubmit: (articles: string[]) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function StyleFormStep1Win95({
  initialArticles = ['', '', ''],
  onSubmit,
  loading = false,
  error = null,
}: StyleFormStep1Win95Props) {
  const [articles, setArticles] = useState([...initialArticles, '', '', ''].slice(0, 3));
  const [activeTab, setActiveTab] = useState('1');

  const updateArticle = (index: number, value: string) => {
    const updated = [...articles];
    updated[index] = value;
    setArticles(updated);
  };

  const allArticlesValid = isStyleSampleValid(articles);
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

  const tabs = [
    { value: '1', label: `Article 1${getArticleStatus(0).hasContent ? ' ✓' : ''}` },
    { value: '2', label: `Article 2${getArticleStatus(1).hasContent ? ' ✓' : ''}` },
    { value: '3', label: `Article 3${getArticleStatus(2).hasContent ? ' ✓' : ''}` },
  ];

  return (
    <div className="space-y-4">
      {/* Progress Section */}
      <Win95Window title="Progress" icon={<span>📊</span>} showControls={false}>
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span>Articles Added</span>
            <span>{filledCount} of 3</span>
          </div>
          <Win95Progress value={progressValue} />
          <div className="flex justify-between text-[10px] text-[var(--win95-button-shadow)]">
            {[1, 2, 3].map((num, index) => {
              const { hasContent } = getArticleStatus(index);
              return (
                <span key={num}>
                  {hasContent ? '✓' : '○'} Article {num}
                  {!hasContent && ' (Required)'}
                </span>
              );
            })}
          </div>
        </div>
      </Win95Window>

      {/* Info Alert */}
      <Win95Alert type="info">
        Paste articles you have written or content whose style you want to emulate. All 3 articles
        are required for accurate style analysis.
      </Win95Alert>

      {/* Error Alert */}
      {error && <Win95Alert type="error">{error}</Win95Alert>}

      {/* Article Tabs */}
      <Win95Window title="Your Articles" icon={<span>📝</span>} showControls={false}>
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
                        (Required)
                      </span>
                    </div>
                    {hasContent && <Win95Badge>{wordCount} words</Win95Badge>}
                  </div>

                  <Win95Textarea
                    placeholder={`Paste your article here...\n\nThis could be a blog post, newsletter, essay, or any written content.`}
                    className="min-h-[200px]"
                    value={articles[index]}
                    onChange={e => updateArticle(index, e.target.value)}
                    disabled={loading}
                  />

                  <div className="flex items-center justify-between text-[10px] text-[var(--win95-button-shadow)]">
                    <span>
                      {wordCount} words | {articles[index].length} characters
                    </span>
                    {wordCount >= 100 && (
                      <span className="text-[var(--win95-success)]">✓ Good length</span>
                    )}
                  </div>
                </div>
              </Win95TabContent>
            );
          })}
        </Win95Tabs>
      </Win95Window>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-[11px]">
          {allArticlesValid ? (
            <span className="text-[var(--win95-success)]">✓ Ready to continue</span>
          ) : (
            <span className="text-[var(--win95-button-shadow)]">
              Add all 3 articles to continue ({filledCount}/3)
            </span>
          )}
        </div>

        <Win95Button
          onClick={handleSubmit}
          disabled={!allArticlesValid || loading}
          variant="primary"
        >
          {loading ? 'Saving...' : 'Continue →'}
        </Win95Button>
      </div>
    </div>
  );
}
