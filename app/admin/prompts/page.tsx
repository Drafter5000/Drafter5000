'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, RotateCcw, Eye, Sparkles, Info } from 'lucide-react';

interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
}

interface PromptData {
  config: PromptConfig;
  defaults: PromptConfig;
  variables: string[];
  variableDescriptions: Record<string, string>;
  sampleVariables: Record<string, string | number>;
}

export default function AdminPromptsPage() {
  const [data, setData] = useState<PromptData | null>(null);
  const [config, setConfig] = useState<PromptConfig>({ systemPrompt: '', userPrompt: '' });
  const [preview, setPreview] = useState<PromptConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<{ systemPrompt?: string; userPrompt?: string }>({});

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/prompts');
      if (res.ok) {
        const responseData: PromptData = await res.json();
        setData(responseData);
        setConfig(responseData.config);
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setMessage({ type: 'error', text: 'Failed to load prompt configuration' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const validateForm = (): boolean => {
    const newErrors: { systemPrompt?: string; userPrompt?: string } = {};

    if (!config.systemPrompt || config.systemPrompt.trim().length === 0) {
      newErrors.systemPrompt = 'System prompt cannot be empty';
    }

    if (!config.userPrompt || config.userPrompt.trim().length === 0) {
      newErrors.userPrompt = 'User prompt cannot be empty';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save prompts');
      }

      setMessage({ type: 'success', text: 'Prompts saved successfully' });
      setPreview(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save prompts';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (!res.ok) {
        throw new Error('Failed to reset prompts');
      }

      const responseData = await res.json();
      setConfig(responseData.config);
      setPreview(null);
      setErrors({});
      setMessage({ type: 'success', text: 'Prompts reset to defaults' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset prompts' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!validateForm()) return;

    setPreviewing(true);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', config }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate preview');
      }

      const responseData = await res.json();
      setPreview(responseData.preview);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate preview' });
    } finally {
      setPreviewing(false);
    }
  };

  const handleSystemPromptChange = (value: string) => {
    setConfig({ ...config, systemPrompt: value });
    if (errors.systemPrompt) {
      setErrors({ ...errors, systemPrompt: undefined });
    }
  };

  const handleUserPromptChange = (value: string) => {
    setConfig({ ...config, userPrompt: value });
    if (errors.userPrompt) {
      setErrors({ ...errors, userPrompt: undefined });
    }
  };

  const insertVariable = (variable: string, field: 'system' | 'user') => {
    const placeholder = `{{${variable}}}`;
    if (field === 'system') {
      setConfig({ ...config, systemPrompt: config.systemPrompt + placeholder });
    } else {
      setConfig({ ...config, userPrompt: config.userPrompt + placeholder });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Prompt Configuration</h1>
          <p className="text-muted-foreground">
            Customize the AI prompts used for generating topic suggestions
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={saving} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Prompts to Defaults?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will restore both system and user prompts to their original default values.
                  Any custom changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-600'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6">
        {/* Dynamic Variables Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Dynamic Variables
            </CardTitle>
            <CardDescription>
              Use these placeholders in your prompts. They will be replaced with actual values at
              runtime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {data?.variables.map(variable => (
                <div
                  key={variable}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
                >
                  <Badge variant="secondary" className="font-mono text-xs shrink-0">
                    {`{{${variable}}}`}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {data.variableDescriptions[variable]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prompt Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Prompt Templates
            </CardTitle>
            <CardDescription>
              Edit the system and user prompts sent to the AI for topic generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* System Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="systemPrompt">
                  System Prompt <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-1">
                  {data?.variables.map(variable => (
                    <Button
                      key={variable}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => insertVariable(variable, 'system')}
                    >
                      +{variable}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                id="systemPrompt"
                value={config.systemPrompt}
                onChange={e => handleSystemPromptChange(e.target.value)}
                placeholder="Enter the system prompt..."
                rows={8}
                className={`font-mono text-sm ${errors.systemPrompt ? 'border-destructive' : ''}`}
              />
              {errors.systemPrompt && (
                <p className="text-xs text-destructive">{errors.systemPrompt}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Defines the AI&apos;s role and behavior for generating topic suggestions
              </p>
            </div>

            {/* User Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="userPrompt">
                  User Prompt <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-1">
                  {data?.variables.map(variable => (
                    <Button
                      key={variable}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => insertVariable(variable, 'user')}
                    >
                      +{variable}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                id="userPrompt"
                value={config.userPrompt}
                onChange={e => handleUserPromptChange(e.target.value)}
                placeholder="Enter the user prompt..."
                rows={6}
                className={`font-mono text-sm ${errors.userPrompt ? 'border-destructive' : ''}`}
              />
              {errors.userPrompt && <p className="text-xs text-destructive">{errors.userPrompt}</p>}
              <p className="text-xs text-muted-foreground">
                Contains the user context and specific instructions for each request
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Preview
            </CardTitle>
            <CardDescription>
              See how your prompts will look with sample data substituted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={previewing}
              className="gap-2"
            >
              {previewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Generate Preview
            </Button>

            {preview && (
              <Tabs defaultValue="system" className="w-full">
                <TabsList>
                  <TabsTrigger value="system">System Prompt Preview</TabsTrigger>
                  <TabsTrigger value="user">User Prompt Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="system" className="mt-4">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {preview.systemPrompt}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="user" className="mt-4">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {preview.userPrompt}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {!preview && (
              <div className="p-8 rounded-lg border border-dashed text-center text-muted-foreground">
                Click &quot;Generate Preview&quot; to see your prompts with sample data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
