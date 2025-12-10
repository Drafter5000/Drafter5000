'use client';

import { useState } from 'react';
import { Win95Window, Win95Button, Win95Input, Win95Badge, Win95Alert } from '@/components/win95';
import { isSubjectValid, isSubjectListValid } from '@/lib/onboarding-validation';
import { apiClient } from '@/lib/api-client';

interface StyleFormStep2Win95Props {
  initialSubjects?: string[];
  onSubmit: (subjects: string[]) => Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
  userId?: string;
  styleSamples?: string[];
}

export function StyleFormStep2Win95({
  initialSubjects = [],
  onSubmit,
  onBack,
  loading = false,
  error = null,
  userId,
  styleSamples,
}: StyleFormStep2Win95Props) {
  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [inputValue, setInputValue] = useState('');
  const [aiActive, setAiActive] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const addSubject = (subject: string) => {
    if (isSubjectValid(subject, subjects)) {
      setSubjects([...subjects, subject.trim()]);
    }
    setInputValue('');
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const generateAISuggestions = async () => {
    if (!userId && (!styleSamples || styleSamples.length === 0)) {
      setAiError('No style samples available. Please complete step 1 first.');
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const response = await apiClient.post<{ suggestions: string[] }>('/ai/suggestions', {
        user_id: userId,
        existing_topics: subjects,
        style_samples: styleSamples,
      });

      setAiActive(true);
      setAiSuggestions(response.suggestions || []);
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

  const handleSubmit = () => {
    onSubmit(subjects);
  };

  return (
    <div className="space-y-4">
      {error && <Win95Alert type="error">{error}</Win95Alert>}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Your Topics */}
        <Win95Window title="Your Topics" icon={<span>💡</span>} showControls={false}>
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px]">Type a topic and press Enter</span>
              {subjects.length > 0 && <Win95Badge>{subjects.length} added</Win95Badge>}
            </div>

            <div className="flex gap-2">
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
              >
                Add
              </Win95Button>
            </div>

            <div className="win95-sunken p-2 min-h-[180px] max-h-[220px] overflow-y-auto win95-scrollbar">
              {subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="text-[24px] mb-2">💡</span>
                  <p className="text-[10px] text-[var(--win95-button-shadow)]">
                    No topics added yet
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {subjects.map((subject, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 win95-raised text-[11px]"
                    >
                      <span>
                        <span className="text-[var(--win95-button-shadow)] mr-2">{index + 1}.</span>
                        {subject}
                      </span>
                      <button
                        onClick={() => removeSubject(index)}
                        className="text-[var(--win95-error)] hover:underline text-[10px]"
                        disabled={loading}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Win95Window>

        {/* AI Suggestions */}
        <Win95Window title="AI Suggestions" icon={<span>✨</span>} showControls={false}>
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px]">
                {aiActive ? 'Click to add' : 'Get AI-powered ideas'}
              </span>
              {!aiActive ? (
                <Win95Button
                  onClick={generateAISuggestions}
                  disabled={aiLoading || loading}
                  size="sm"
                >
                  {aiLoading ? 'Analyzing...' : 'Generate'}
                </Win95Button>
              ) : (
                <Win95Button
                  onClick={generateAISuggestions}
                  disabled={aiLoading || loading}
                  size="sm"
                >
                  {aiLoading ? '...' : 'Refresh'}
                </Win95Button>
              )}
            </div>

            {aiError && <Win95Alert type="error">{aiError}</Win95Alert>}

            <div className="win95-sunken p-2 min-h-[180px] max-h-[220px] overflow-y-auto win95-scrollbar">
              {!aiActive ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="text-[24px] mb-2">✨</span>
                  <p className="text-[10px] text-[var(--win95-button-shadow)]">
                    {aiLoading ? 'Analyzing your writing style...' : 'Need inspiration?'}
                  </p>
                </div>
              ) : aiLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="text-[11px]">Generating new ideas...</span>
                </div>
              ) : aiSuggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="text-[24px] mb-2">✨</span>
                  <p className="text-[10px] text-[var(--win95-success)]">All suggestions added!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => addFromAI(suggestion)}
                      disabled={loading}
                      className="w-full text-left p-2 win95-raised text-[11px] hover:bg-[var(--win95-bg-dark)] disabled:opacity-50"
                    >
                      <span className="text-[var(--win95-link)] mr-2">+</span>
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Win95Window>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--win95-button-shadow)]">
        {onBack ? (
          <Win95Button onClick={onBack} disabled={loading}>
            ← Back
          </Win95Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-4">
          {subjects.length > 0 && (
            <span className="text-[11px] text-[var(--win95-button-shadow)]">
              {subjects.length} topic{subjects.length !== 1 ? 's' : ''} ready
            </span>
          )}
          <Win95Button
            onClick={handleSubmit}
            disabled={!isSubjectListValid(subjects) || loading}
            variant="primary"
          >
            {loading ? 'Saving...' : 'Continue →'}
          </Win95Button>
        </div>
      </div>
    </div>
  );
}
