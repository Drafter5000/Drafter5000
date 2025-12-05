'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Sparkles,
  X,
  Loader2,
  Lightbulb,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { isSubjectValid, isSubjectListValid } from '@/lib/onboarding-validation';

const AI_SUGGESTIONS = [
  'The Future of Remote Work in 2025',
  'Building a Personal Brand Online',
  'Productivity Hacks That Actually Work',
  'The Art of Effective Communication',
  'Sustainable Living Tips for Beginners',
  'Mental Health in the Digital Age',
  'Investing Strategies for Millennials',
  'The Power of Habit Formation',
];

interface StyleFormStep2Props {
  initialSubjects?: string[];
  onSubmit: (subjects: string[]) => Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function StyleFormStep2({
  initialSubjects = [],
  onSubmit,
  onBack,
  loading = false,
  error = null,
}: StyleFormStep2Props) {
  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [inputValue, setInputValue] = useState('');
  const [aiActive, setAiActive] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const addSubject = (subject: string) => {
    if (isSubjectValid(subject, subjects)) {
      setSubjects([...subjects, subject.trim()]);
    }
    setInputValue('');
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const activateAI = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiActive(true);
      setAiSuggestions(AI_SUGGESTIONS.filter(s => !subjects.includes(s)));
      setAiLoading(false);
    }, 800);
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
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Your Topics
              </CardTitle>
              {subjects.length > 0 && <Badge variant="secondary">{subjects.length} added</Badge>}
            </div>
            <CardDescription>Type a topic and press Enter or click Add</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
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
              />
              <Button
                onClick={() => addSubject(inputValue)}
                disabled={!inputValue.trim() || loading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="min-h-[240px] max-h-[280px] overflow-y-auto space-y-2">
              {subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Lightbulb className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No topics added yet</p>
                </div>
              ) : (
                subjects.map((subject, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card group hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="h-6 w-6 p-0 justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium">{subject}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubject(index)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Suggestions
              </CardTitle>
              {!aiActive && (
                <Button onClick={activateAI} size="sm" disabled={aiLoading || loading}>
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Generate Ideas'
                  )}
                </Button>
              )}
            </div>
            <CardDescription>
              {aiActive ? 'Click a suggestion to add it' : 'Get AI-powered topic ideas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!aiActive ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Need inspiration?</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {aiSuggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Sparkles className="h-6 w-6 text-primary mb-3" />
                    <p className="text-sm font-medium text-primary">All suggestions added!</p>
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

      <div className="flex items-center justify-between pt-4 border-t">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={loading}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        {!onBack && <div />}

        <div className="flex items-center gap-4">
          {subjects.length > 0 && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {subjects.length} topic{subjects.length !== 1 ? 's' : ''} ready
            </span>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!isSubjectListValid(subjects) || loading}
            size="lg"
          >
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
    </div>
  );
}
