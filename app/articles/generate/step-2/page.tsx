'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Win95Button, Win95Input, Win95Alert, Win95Badge } from '@/components/win95';
import { DraftSessionService } from '@/lib/draft-session';
import { isSubjectValid, isSubjectListValid } from '@/lib/onboarding-validation';

/**
 * Step 2 - Topics (Anonymous Access)
 * Requirements: 3.1, 3.3, 3.4
 */
export default function GenerateStep2Page() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [styleSamples, setStyleSamples] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const draftSession = DraftSessionService.load();

    if (!draftSession?.style_samples || draftSession.style_samples.length === 0) {
      router.push('/articles/generate/step-1');
      return;
    }

    setStyleSamples(draftSession.style_samples);

    if (draftSession?.subjects && draftSession.subjects.length > 0) {
      setSubjects(draftSession.subjects);
    }
    setInitialLoading(false);
  }, [router]);

  const addSubject = (subject: string) => {
    if (isSubjectValid(subject, subjects)) {
      setSubjects([...subjects, subject.trim()]);
    }
    setInputValue('');
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSubjectListValid(subjects)) {
        setError('Please add at least one topic');
        setLoading(false);
        return;
      }

      // Save topics as topic entries with "Needs Draft" status
      DraftSessionService.saveTopicEntries(subjects);
      DraftSessionService.save({
        current_step: 3,
      });

      router.push('/articles/generate/step-3');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save subjects';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/articles/generate/step-1');
  };

  const generateAISuggestions = async () => {
    if (styleSamples.length === 0) {
      setAiError('No style samples found. Please complete step 1 first.');
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/suggestions/anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style_samples: styleSamples,
          existing_topics: subjects,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate suggestions');
      }

      setAiSuggestions(data.suggestions || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate suggestions';
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const addFromAI = (suggestion: string) => {
    if (isSubjectValid(suggestion, subjects)) {
      setSubjects([...subjects, suggestion]);
      setAiSuggestions(aiSuggestions.filter(s => s !== suggestion));
    }
  };

  if (initialLoading) {
    return (
      <div className="text-center py-8">
        <span className="text-[11px] win95-loading">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-[32px] mb-2">💡</div>
        <h2 className="text-[14px] font-bold">Choose Your Topics</h2>
        <p className="text-[11px] text-[var(--win95-button-shadow)]">
          Add subjects you want to write about. Each topic becomes one article.
        </p>
      </div>

      {error && (
        <Win95Alert type="error" title="Error">
          {error}
        </Win95Alert>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Your Topics */}
        <div className="win95-sunken p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold">💡 Your Topics</span>
            {subjects.length > 0 && <Win95Badge>{subjects.length} added</Win95Badge>}
          </div>
          <p className="text-[10px] text-[var(--win95-button-shadow)] mb-2">
            Type a topic and press Enter or click Add
          </p>
          <div className="win95-sunken p-2 mb-3 text-[9px] text-[var(--win95-button-shadow)]">
            <span className="font-bold">Example format:</span> "Why Follow-Ups Fail When Reps Only
            'Check In'—And a Repeatable Formula for Follow-Ups That Actually Move Deals Forward"
          </div>

          <div className="flex gap-2 mb-3">
            <Win95Input
              placeholder="Enter a topic..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSubject(inputValue);
                }
              }}
              disabled={loading}
              className="flex-1"
            />
            <Win95Button
              onClick={() => addSubject(inputValue)}
              disabled={!inputValue.trim() || loading}
              size="sm"
            >
              Add
            </Win95Button>
          </div>

          <div className="win95-field min-h-[180px] max-h-[200px] overflow-y-auto win95-scrollbar p-2">
            {subjects.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-[24px] mb-2">💡</div>
                <p className="text-[10px] text-[var(--win95-button-shadow)]">No topics added yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {subjects.map((subject, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 win95-raised group"
                  >
                    <div className="flex items-center gap-2">
                      <Win95Badge variant="outline">{index + 1}</Win95Badge>
                      <span className="text-[11px]">{subject}</span>
                    </div>
                    <Win95Button
                      onClick={() => removeSubject(index)}
                      size="sm"
                      disabled={loading}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </Win95Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="win95-sunken p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold">✨ AI Suggestions</span>
            <div className="flex items-center gap-2">
              {aiSuggestions.length > 0 && (
                <Win95Button
                  onClick={generateAISuggestions}
                  size="sm"
                  disabled={aiLoading || loading}
                >
                  {aiLoading ? '...' : '↻'}
                </Win95Button>
              )}
              {aiSuggestions.length === 0 && (
                <Win95Button
                  onClick={generateAISuggestions}
                  size="sm"
                  disabled={aiLoading || loading}
                >
                  {aiLoading ? 'Generating...' : 'Generate Ideas'}
                </Win95Button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-[var(--win95-button-shadow)] mb-3">
            {aiSuggestions.length > 0
              ? 'Click a suggestion to add it to your topics'
              : 'Get AI-powered topic ideas based on your writing style'}
          </p>

          {aiError && (
            <Win95Alert type="error" title="Error" className="mb-3">
              {aiError}
            </Win95Alert>
          )}

          <div className="win95-field min-h-[180px] max-h-[200px] overflow-y-auto win95-scrollbar p-2">
            {aiLoading ? (
              <div className="text-center py-8">
                <div className="text-[24px] mb-2 animate-pulse">✨</div>
                <p className="text-[10px] text-[var(--win95-button-shadow)]">
                  Analyzing your writing style...
                </p>
              </div>
            ) : aiSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-[24px] mb-2">✨</div>
                <p className="text-[10px] text-[var(--win95-button-shadow)]">
                  Click "Generate Ideas" to get AI suggestions
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => addFromAI(suggestion)}
                    disabled={loading}
                    className="w-full text-left p-2 win95-raised hover:bg-[var(--win95-button-face)] transition-colors text-[11px] flex items-center gap-2 disabled:opacity-50"
                  >
                    <span className="text-[var(--win95-button-highlight)]">+</span>
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--win95-button-shadow)]">
        <Win95Button onClick={handleBack} disabled={loading}>
          ← Back
        </Win95Button>

        <div className="flex items-center gap-4">
          {subjects.length > 0 && (
            <span className="text-[11px] text-[var(--win95-button-shadow)]">
              {subjects.length} topic{subjects.length !== 1 ? 's' : ''} ready
            </span>
          )}
          <Win95Button
            onClick={handleSubmit}
            disabled={!isSubjectListValid(subjects) || loading}
            size="lg"
            className={loading ? 'win95-loading' : ''}
          >
            {loading ? 'Saving...' : 'Continue →'}
          </Win95Button>
        </div>
      </div>
    </div>
  );
}
