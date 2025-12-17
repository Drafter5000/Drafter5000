'use client';

import { useState } from 'react';
import {
  Win95Window,
  Win95Button,
  Win95Textarea,
  Win95Tabs,
  Win95TabContent,
  Win95Badge,
  Win95Alert,
} from '@/components/win95';
import { countWords, isStyleSampleValid } from '@/lib/onboarding-validation';

const CHARACTER_LIMIT = 2000;

interface StyleFormStep1Win95Props {
  initialArticles?: string[];
  initialJobTitle?: string;
  onSubmit: (articles: string[], jobTitle: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function StyleFormStep1Win95({
  initialArticles = ['', '', ''],
  initialJobTitle = '',
  onSubmit,
  loading = false,
  error = null,
}: StyleFormStep1Win95Props) {
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

  const tabs = [
    { value: '1', label: `Article 1${getArticleStatus(0).hasContent ? ' ✓' : ''}` },
    { value: '2', label: `Article 2${getArticleStatus(1).hasContent ? ' ✓' : ''}` },
    { value: '3', label: `Article 3${getArticleStatus(2).hasContent ? ' ✓' : ''}` },
    { value: '4', label: `Job Title${hasJobTitle ? ' ✓' : ''}` },
  ];

  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <Win95Alert type="info">
        Paste articles you have written or content whose style you want to emulate. All three
        articles should come from the same author to properly train the AI.
      </Win95Alert>

      {/* Error Alert */}
      {error && <Win95Alert type="error">{error}</Win95Alert>}

      {/* Article Tabs */}
      <Win95Window title="Your Articles" icon={<span>📝</span>} showControls={false}>
        <Win95Tabs value={activeTab} onValueChange={setActiveTab} tabs={tabs}>
          {[1, 2, 3].map((num, index) => {
            const { hasContent, wordCount, charCount } = getArticleStatus(index);
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
                    maxLength={CHARACTER_LIMIT}
                  />

                  <div className="flex items-center justify-between text-[10px] text-[var(--win95-button-shadow)]">
                    <span>
                      {wordCount} words | {charCount} characters
                    </span>
                    <div className="flex items-center gap-2">
                      {charCount >= CHARACTER_LIMIT && (
                        <span className="text-[var(--win95-warning)]">Character limit reached</span>
                      )}
                      {wordCount >= 100 && (
                        <span className="text-[var(--win95-success)]">✓ Good length</span>
                      )}
                    </div>
                  </div>
                </div>
              </Win95TabContent>
            );
          })}

          {/* Job Title Tab Content */}
          <Win95TabContent value="4" activeValue={activeTab}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold">💼 AI's Job Title</span>
                  <span className="text-[10px] text-[var(--win95-button-shadow)] ml-2">
                    What job do you want your drafting AI to incarnate
                  </span>
                </div>
                {hasJobTitle && (
                  <Win95Badge>{jobTitle.split(/\s+/).filter(w => w).length} words</Win95Badge>
                )}
              </div>

              <Win95Textarea
                placeholder={`Enter your job title here...\n\nExamples:\n"Chief Technology Officer of a tech startup"\n"CEO of a mining company"\n"Chief Revenue Officer of an insurance company"`}
                className="min-h-[200px]"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                disabled={loading}
              />

              <div className="text-[10px] text-[var(--win95-button-shadow)]">
                {jobTitle.split(/\s+/).filter(w => w).length} words | {jobTitle.length} characters
              </div>
            </div>
          </Win95TabContent>
        </Win95Tabs>
      </Win95Window>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-[11px]">
          {isComplete ? (
            <span className="text-[var(--win95-success)]">✓ Ready to continue</span>
          ) : (
            <span className="text-[var(--win95-button-shadow)]">
              Add all 3 articles and job title to continue
            </span>
          )}
        </div>

        {isOnJobTitleTab ? (
          <Win95Button onClick={handleSubmit} disabled={!isComplete || loading} variant="primary">
            {loading ? 'Saving...' : 'Continue →'}
          </Win95Button>
        ) : (
          <Win95Button
            onClick={handleContinue}
            disabled={!canContinue || loading}
            variant="primary"
          >
            Continue →
          </Win95Button>
        )}
      </div>
    </div>
  );
}
