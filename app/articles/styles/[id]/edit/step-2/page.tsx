'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { EditStyleContext } from '../layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Win95Button, Win95Input, Win95Badge, Win95Alert } from '@/components/win95';
import {
  Lightbulb,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { isSubjectValid, isSubjectListValid } from '@/lib/onboarding-validation';

export default function EditStep2Page() {
  const router = useRouter();
  const params = useParams();
  const styleId = params.id as string;
  const editContext = useContext(EditStyleContext);
  const designContext = useContext(DesignContext);
  const designMode: DesignMode = designContext?.designMode ?? 'modern';

  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize from style data
  useEffect(() => {
    if (editContext?.style && !initialized) {
      setSubjects(editContext.style.subjects || []);
      setInitialized(true);
    }
  }, [editContext?.style, initialized]);

  const addSubject = (subject: string) => {
    if (isSubjectValid(subject, subjects)) {
      setSubjects([...subjects, subject.trim()]);
    }
    setSubjectInput('');
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isSubjectListValid(subjects)) {
      setError('Please add at least one topic');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update the style in context
      editContext?.updateStyle({ subjects });

      // Navigate to next step
      router.push(`/articles/styles/${styleId}/edit/step-3`);
    } catch (err) {
      setError('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Save current state before going back
    editContext?.updateStyle({ subjects });
    router.push(`/articles/styles/${styleId}/edit/step-1`);
  };

  if (editContext?.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isValid = isSubjectListValid(subjects);

  // Win95 Design
  if (designMode === 'win95') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-[32px] mb-2">💡</div>
          <h2 className="text-[14px] font-bold">Edit Topics</h2>
          <p className="text-[11px] text-[var(--win95-button-shadow)]">
            Update the subjects you want to write about
          </p>
        </div>

        {error && (
          <Win95Alert type="error" title="Error">
            {error}
          </Win95Alert>
        )}

        <div className="flex gap-2">
          <Win95Input
            placeholder="Enter a topic..."
            value={subjectInput}
            onChange={e => setSubjectInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSubject(subjectInput);
              }
            }}
            disabled={loading}
            className="flex-1"
          />
          <Win95Button
            onClick={() => addSubject(subjectInput)}
            disabled={!subjectInput.trim() || loading}
            size="sm"
          >
            Add
          </Win95Button>
        </div>

        <div className="win95-field min-h-[150px] max-h-[300px] overflow-y-auto p-2">
          {subjects.length === 0 ? (
            <div className="text-center py-4 text-[10px] text-[var(--win95-button-shadow)]">
              No topics added yet
            </div>
          ) : (
            <div className="space-y-1">
              {subjects.map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-2 win95-raised">
                  <div className="flex items-center gap-2">
                    <Win95Badge variant="outline">{index + 1}</Win95Badge>
                    <span className="text-[11px]">{subject}</span>
                  </div>
                  <Win95Button onClick={() => removeSubject(index)} size="sm" disabled={loading}>
                    ×
                  </Win95Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Win95Button onClick={handleBack} disabled={loading}>
            ← Back
          </Win95Button>
          <Win95Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? 'Saving...' : 'Next: Settings →'}
          </Win95Button>
        </div>
      </div>
    );
  }

  // Modern Design
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Edit Topics</h2>
        <p className="text-muted-foreground">Update the subjects you want to write about</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Your Topics</CardTitle>
          <CardDescription>
            Each topic will become an article. Add, remove, or reorder as needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a topic..."
              value={subjectInput}
              onChange={e => setSubjectInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSubject(subjectInput);
                }
              }}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={() => addSubject(subjectInput)}
              disabled={!subjectInput.trim() || loading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <Lightbulb className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No topics added yet</p>
              <p className="text-sm text-muted-foreground">Add your first topic above</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {subjects.map((subject, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{subject}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeSubject(index)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {subjects.length > 0 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">
                {subjects.length} topic{subjects.length !== 1 ? 's' : ''} ready
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={handleBack} disabled={loading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button onClick={handleSubmit} disabled={!isValid || loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              Next: Settings
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
