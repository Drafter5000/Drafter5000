'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Save,
  RotateCcw,
  Eye,
  Sparkles,
  Info,
  Key,
  Play,
  BarChart3,
  Trash2,
  Check,
  X,
  Clock,
  Copy,
  Zap,
} from 'lucide-react';

// Types
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

interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  pricingTier: 'free' | 'standard' | 'premium';
}

interface LLMProvider {
  id: string;
  name: string;
  models: LLMModel[];
  apiKeyConfigured: boolean;
  maskedApiKey?: string;
}

interface PlaygroundResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  responseTimeMs: number;
  model: string;
  provider: string;
}

interface UsageRecord {
  id: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  responseTimeMs?: number;
  createdAt: string;
}

interface UsageStats {
  provider: string;
  period: 'day' | 'week' | 'month';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface UsageData {
  stats: UsageStats[];
  history: UsageRecord[];
  summary: {
    totalRequests: number;
    totalTokens: number;
    avgResponseTime: number;
  };
}

export default function AdminPromptsPage() {
  // Prompt Config State
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [config, setConfig] = useState<PromptConfig>({ systemPrompt: '', userPrompt: '' });
  const [preview, setPreview] = useState<PromptConfig | null>(null);
  const [promptLoading, setPromptLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<{ systemPrompt?: string; userPrompt?: string }>({});

  // Provider State
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  // Playground State
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [playgroundSystem, setPlaygroundSystem] = useState('');
  const [playgroundUser, setPlaygroundUser] = useState('');
  const [playgroundResponse, setPlaygroundResponse] = useState<PlaygroundResponse | null>(null);
  const [playgroundError, setPlaygroundError] = useState<string | null>(null);
  const [playgroundRunning, setPlaygroundRunning] = useState(false);

  // Usage State
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  // Fetch prompt config
  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/prompts');
      if (res.ok) {
        const responseData: PromptData = await res.json();
        setPromptData(responseData);
        setConfig(responseData.config);
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setMessage({ type: 'error', text: 'Failed to load prompt configuration' });
    } finally {
      setPromptLoading(false);
    }
  }, []);

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/llm-providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  // Fetch usage
  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/playground/usage');
      if (res.ok) {
        const data = await res.json();
        setUsageData(data);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
    fetchProviders();
    fetchUsage();
  }, [fetchPrompts, fetchProviders, fetchUsage]);

  // Prompt handlers
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
      if (!res.ok) throw new Error('Failed to reset prompts');
      const responseData = await res.json();
      setConfig(responseData.config);
      setPreview(null);
      setErrors({});
      setMessage({ type: 'success', text: 'Prompts reset to defaults' });
    } catch {
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
      if (!res.ok) throw new Error('Failed to generate preview');
      const responseData = await res.json();
      setPreview(responseData.preview);
    } catch {
      setMessage({ type: 'error', text: 'Failed to generate preview' });
    } finally {
      setPreviewing(false);
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

  // Provider handlers
  const handleSaveApiKey = async (providerId: string) => {
    const apiKey = apiKeyInputs[providerId];
    if (!apiKey) return;
    setSavingProvider(providerId);
    try {
      const res = await fetch('/api/admin/llm-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', providerId, apiKey }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save API key');
      }
      setApiKeyInputs({ ...apiKeyInputs, [providerId]: '' });
      fetchProviders();
      setMessage({ type: 'success', text: 'API key saved successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save API key';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSavingProvider(null);
    }
  };

  const handleDeleteApiKey = async (providerId: string) => {
    setSavingProvider(providerId);
    try {
      const res = await fetch('/api/admin/llm-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', providerId }),
      });
      if (!res.ok) throw new Error('Failed to delete API key');
      fetchProviders();
      setMessage({ type: 'success', text: 'API key deleted successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete API key' });
    } finally {
      setSavingProvider(null);
    }
  };

  // Playground handlers
  const handleRunPlayground = async () => {
    if (!selectedProvider || !selectedModel || !playgroundSystem || !playgroundUser) {
      setPlaygroundError('Please fill in all fields');
      return;
    }
    setPlaygroundRunning(true);
    setPlaygroundError(null);
    setPlaygroundResponse(null);
    try {
      const res = await fetch('/api/admin/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          systemPrompt: playgroundSystem,
          userPrompt: playgroundUser,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPlaygroundError(data.error || 'Failed to run playground');
        return;
      }
      setPlaygroundResponse(data.response);
      fetchUsage(); // Refresh usage stats
    } catch (error) {
      setPlaygroundError(error instanceof Error ? error.message : 'Failed to run playground');
    } finally {
      setPlaygroundRunning(false);
    }
  };

  const handleLoadCurrentConfig = () => {
    setPlaygroundSystem(config.systemPrompt);
    setPlaygroundUser(config.userPrompt);
  };

  const getAvailableModels = (): LLMModel[] => {
    const provider = providers.find(p => p.id === selectedProvider);
    return provider?.models || [];
  };

  const getConfiguredProviders = () => providers.filter(p => p.apiKeyConfigured);

  // Format helpers
  const formatNumber = (num: number) => num.toLocaleString();
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  // Copy to clipboard
  const [copied, setCopied] = useState<'system' | 'user' | null>(null);
  const copyToClipboard = async (text: string, type: 'system' | 'user') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (promptLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Configuration</h1>
        <p className="text-muted-foreground">
          Manage AI prompts, API keys, and test with the playground
        </p>
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

      <Tabs defaultValue="prompts" className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="prompts" className="gap-2 cursor-pointer">
            <Sparkles className="h-4 w-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2 cursor-pointer">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="playground" className="gap-2 cursor-pointer">
            <Play className="h-4 w-4" />
            Playground
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2 cursor-pointer">
            <BarChart3 className="h-4 w-4" />
            Usage
          </TabsTrigger>
        </TabsList>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-6 mt-6">
          <div className="flex justify-end gap-2">
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
                    This will restore both prompts to their original default values.
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Dynamic Variables
              </CardTitle>
              <CardDescription>
                Use these placeholders in your prompts. They will be replaced at runtime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {promptData?.variables.map(variable => (
                  <div
                    key={variable}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
                  >
                    <Badge variant="secondary" className="font-mono text-xs shrink-0">
                      {`{{${variable}}}`}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {promptData.variableDescriptions[variable]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Prompt Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemPrompt">
                    System Prompt <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-1">
                    {promptData?.variables.map(variable => (
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
                  onChange={e => {
                    setConfig({ ...config, systemPrompt: e.target.value });
                    if (errors.systemPrompt) setErrors({ ...errors, systemPrompt: undefined });
                  }}
                  rows={8}
                  className={`font-mono text-sm ${errors.systemPrompt ? 'border-destructive' : ''}`}
                />
                {errors.systemPrompt && (
                  <p className="text-xs text-destructive">{errors.systemPrompt}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="userPrompt">
                    User Prompt <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-1">
                    {promptData?.variables.map(variable => (
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
                  onChange={e => {
                    setConfig({ ...config, userPrompt: e.target.value });
                    if (errors.userPrompt) setErrors({ ...errors, userPrompt: undefined });
                  }}
                  rows={6}
                  className={`font-mono text-sm ${errors.userPrompt ? 'border-destructive' : ''}`}
                />
                {errors.userPrompt && (
                  <p className="text-xs text-destructive">{errors.userPrompt}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Preview
              </CardTitle>
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
                    <div className="relative p-4 rounded-lg border bg-muted/30">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => copyToClipboard(preview.systemPrompt, 'system')}
                      >
                        {copied === 'system' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <pre className="whitespace-pre-wrap text-sm font-mono pr-10">
                        {preview.systemPrompt}
                      </pre>
                    </div>
                  </TabsContent>
                  <TabsContent value="user" className="mt-4">
                    <div className="relative p-4 rounded-lg border bg-muted/30">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => copyToClipboard(preview.userPrompt, 'user')}
                      >
                        {copied === 'user' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <pre className="whitespace-pre-wrap text-sm font-mono pr-10">
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
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                LLM Provider API Keys
              </CardTitle>
              <CardDescription>
                Configure API keys for different AI providers to use in the playground
              </CardDescription>
            </CardHeader>
            <CardContent>
              {providersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {providers.map(provider => (
                    <div key={provider.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{provider.name}</h3>
                          {provider.apiKeyConfigured ? (
                            <Badge variant="default" className="gap-1">
                              <Check className="h-3 w-3" /> Configured
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <X className="h-3 w-3" /> Not Configured
                            </Badge>
                          )}
                        </div>
                        {provider.apiKeyConfigured && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive gap-1">
                                <Trash2 className="h-4 w-4" /> Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove the {provider.name} API key. You won&apos;t be
                                  able to use this provider in the playground until you add a new
                                  key.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteApiKey(provider.id)}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                      {provider.apiKeyConfigured ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground shrink-0">
                            Current key:
                          </span>
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono truncate max-w-[200px]">
                            {provider.maskedApiKey}
                          </code>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder={`Enter ${provider.name} API key`}
                            value={apiKeyInputs[provider.id] || ''}
                            onChange={e =>
                              setApiKeyInputs({ ...apiKeyInputs, [provider.id]: e.target.value })
                            }
                            className="font-mono"
                          />
                          <Button
                            onClick={() => handleSaveApiKey(provider.id)}
                            disabled={!apiKeyInputs[provider.id] || savingProvider === provider.id}
                          >
                            {savingProvider === provider.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Save'
                            )}
                          </Button>
                        </div>
                      )}
                      <div className="mt-3 text-xs text-muted-foreground">
                        Available models: {provider.models.map(m => m.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Playground Tab */}
        <TabsContent value="playground" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                AI Playground
              </CardTitle>
              <CardDescription>Test prompts with different AI providers and models</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getConfiguredProviders().length === 0 ? (
                <div className="p-8 rounded-lg border border-dashed text-center">
                  <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No API keys configured</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add an API key in the API Keys tab to use the playground
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Select
                        value={selectedProvider}
                        onValueChange={v => {
                          setSelectedProvider(v);
                          setSelectedModel('');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {getConfiguredProviders().map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Select
                        value={selectedModel}
                        onValueChange={setSelectedModel}
                        disabled={!selectedProvider}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableModels().map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({formatNumber(m.contextWindow)} ctx)
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>System Prompt</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadCurrentConfig}
                        className="text-xs"
                      >
                        Load Current Config
                      </Button>
                    </div>
                    <Textarea
                      value={playgroundSystem}
                      onChange={e => setPlaygroundSystem(e.target.value)}
                      placeholder="Enter system prompt..."
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>User Prompt</Label>
                    <Textarea
                      value={playgroundUser}
                      onChange={e => setPlaygroundUser(e.target.value)}
                      placeholder="Enter user prompt..."
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Button
                    onClick={handleRunPlayground}
                    disabled={playgroundRunning || !selectedProvider || !selectedModel}
                    className="gap-2"
                  >
                    {playgroundRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Run
                  </Button>

                  {playgroundError && (
                    <div className="p-4 rounded-lg border bg-destructive/10 border-destructive/30 text-destructive">
                      {playgroundError}
                    </div>
                  )}

                  {playgroundResponse && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {playgroundResponse.responseTimeMs}ms
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Zap className="h-4 w-4" />
                          {formatNumber(playgroundResponse.usage.totalTokens)} tokens
                        </div>
                        <Badge variant="outline">
                          In: {formatNumber(playgroundResponse.usage.inputTokens)} | Out:{' '}
                          {formatNumber(playgroundResponse.usage.outputTokens)}
                        </Badge>
                      </div>
                      <div className="p-4 rounded-lg border bg-muted/30">
                        <pre className="whitespace-pre-wrap text-sm">
                          {playgroundResponse.content}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6 mt-6">
          {usageLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(usageData?.summary.totalRequests || 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Tokens
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(usageData?.summary.totalTokens || 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avg Response Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {usageData?.summary.avgResponseTime || 0}ms
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Usage by Provider</CardTitle>
                </CardHeader>
                <CardContent>
                  {usageData?.stats && usageData.stats.length > 0 ? (
                    <div className="space-y-4">
                      {['day', 'week', 'month'].map(period => {
                        const periodStats = usageData.stats.filter(s => s.period === period);
                        if (periodStats.length === 0) return null;
                        return (
                          <div key={period}>
                            <h4 className="font-medium mb-2 capitalize">This {period}</h4>
                            <div className="grid gap-2">
                              {periodStats.map(stat => (
                                <div
                                  key={`${stat.provider}-${stat.period}`}
                                  className="flex items-center justify-between p-2 rounded bg-muted/50"
                                >
                                  <span className="font-medium capitalize">{stat.provider}</span>
                                  <div className="text-sm text-muted-foreground">
                                    {formatNumber(stat.totalTokens)} tokens (In:{' '}
                                    {formatNumber(stat.inputTokens)} | Out:{' '}
                                    {formatNumber(stat.outputTokens)})
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No usage data yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {usageData?.history && usageData.history.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead className="text-right">Tokens</TableHead>
                          <TableHead className="text-right">Time</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usageData.history.slice(0, 20).map(record => (
                          <TableRow key={record.id}>
                            <TableCell className="capitalize">{record.provider}</TableCell>
                            <TableCell className="font-mono text-sm">{record.model}</TableCell>
                            <TableCell className="text-right">
                              {formatNumber(record.totalTokens)}
                            </TableCell>
                            <TableCell className="text-right">{record.responseTimeMs}ms</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatDate(record.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No requests yet</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
