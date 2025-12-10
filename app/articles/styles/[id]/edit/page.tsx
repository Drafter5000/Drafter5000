'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import {
  Win95Window,
  Win95Button,
  Win95Tabs,
  Win95TabContent,
  Win95Input,
  Win95Textarea,
  Win95Select,
  Win95Checkbox,
  Win95Alert,
  Win95Badge,
} from '@/components/win95';
import { apiClient } from '@/lib/api-client';
import {
  toggleDay as toggleDayUtil,
  toggleAllDays,
  areAllDaysSelected,
  DayCode,
} from '@/lib/day-selection';
import {
  countWords,
  isStyleSampleValid,
  isSubjectValid,
  isSubjectListValid,
  isStep3FormValid,
} from '@/lib/onboarding-validation';
import Link from 'next/link';
import type { ArticleStyle } from '@/lib/types';
import { LANGUAGES, DAYS } from '@/lib/constants';

export default function EditStylePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [style, setStyle] = useState<ArticleStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('samples');

  // Form state
  const [articles, setArticles] = useState<string[]>(['', '', '']);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [frequency, setFrequency] = useState<DayCode[]>([]);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const fetchStyle = async () => {
      if (!user) return;
      try {
        const data = await apiClient.get<ArticleStyle>(`/article-styles/${id}?user_id=${user.id}`);
        setStyle(data);
        setArticles([...data.style_samples, '', '', ''].slice(0, 3));
        setSubjects(data.subjects);
        setName(data.name);
        setEmail(data.email || '');
        setFrequency(data.delivery_days as DayCode[]);
        setLanguage(data.preferred_language);
        if (data.display_name) {
          const parts = data.display_name.trim().split(/\s+/);
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
      } catch (err) {
        console.error('Failed to fetch style:', err);
        router.push('/articles/styles');
      } finally {
        setLoading(false);
      }
    };
    fetchStyle();
  }, [user, id, router]);

  const handleSave = async () => {
    if (!user || !style) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient.put(`/article-styles/${id}`, {
        user_id: user.id,
        name: name.trim(),
        email,
        display_name: `${firstName} ${lastName}`.trim(),
        preferred_language: language,
        delivery_days: frequency,
        style_samples: articles.filter(a => a.trim()),
        subjects,
      });
      router.push(`/articles/styles/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const addSubject = (subject: string) => {
    if (isSubjectValid(subject, subjects)) {
      setSubjects([...subjects, subject.trim()]);
    }
    setSubjectInput('');
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleToggleDay = (dayId: DayCode) => {
    setFrequency(prev => toggleDayUtil(prev, dayId));
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto">
            <DashboardHeader />
            <Win95Window title="Loading..." icon={<span>📄</span>}>
              <div className="text-center py-8">
                <span className="text-[11px] win95-loading">Loading style...</span>
              </div>
            </Win95Window>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!style) return null;

  const tabs = [
    { value: 'samples', label: '📄 Samples' },
    { value: 'subjects', label: '💡 Topics' },
    { value: 'settings', label: '⚙️ Settings' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <DashboardHeader />

          <Win95Window title={`Edit Style: ${style.name}`} icon={<span>✏️</span>}>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <Link href={`/articles/styles/${id}`}>
                  <Win95Button size="sm">← Back</Win95Button>
                </Link>
                <Win95Button
                  onClick={handleSave}
                  disabled={saving}
                  className={saving ? 'win95-loading' : ''}
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </Win95Button>
              </div>

              {error && (
                <Win95Alert type="error" title="Error">
                  {error}
                </Win95Alert>
              )}

              <Win95Tabs value={activeTab} onValueChange={setActiveTab} tabs={tabs}>
                {/* Samples Tab */}
                <Win95TabContent value="samples" activeValue={activeTab}>
                  <div className="space-y-3">
                    {[0, 1, 2].map(index => {
                      const wordCount = countWords(articles[index]);
                      const hasContent = articles[index].trim().length > 0;
                      return (
                        <div key={index} className="win95-sunken p-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold">
                              Article {index + 1} (Required)
                            </span>
                            {hasContent && <Win95Badge>{wordCount} words</Win95Badge>}
                          </div>
                          <Win95Textarea
                            placeholder="Paste your article here..."
                            className="min-h-[100px]"
                            value={articles[index]}
                            onChange={e => {
                              const updated = [...articles];
                              updated[index] = e.target.value;
                              setArticles(updated);
                            }}
                            disabled={saving}
                          />
                        </div>
                      );
                    })}
                  </div>
                </Win95TabContent>

                {/* Topics Tab */}
                <Win95TabContent value="subjects" activeValue={activeTab}>
                  <div className="space-y-3">
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
                        disabled={saving}
                        className="flex-1"
                      />
                      <Win95Button
                        onClick={() => addSubject(subjectInput)}
                        disabled={!subjectInput.trim() || saving}
                        size="sm"
                      >
                        Add
                      </Win95Button>
                    </div>
                    <div className="win95-field min-h-[150px] max-h-[200px] overflow-y-auto p-2">
                      {subjects.length === 0 ? (
                        <div className="text-center py-4 text-[10px] text-[var(--win95-button-shadow)]">
                          No topics added yet
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {subjects.map((subject, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 win95-raised"
                            >
                              <div className="flex items-center gap-2">
                                <Win95Badge variant="outline">{index + 1}</Win95Badge>
                                <span className="text-[11px]">{subject}</span>
                              </div>
                              <Win95Button
                                onClick={() => removeSubject(index)}
                                size="sm"
                                disabled={saving}
                              >
                                ×
                              </Win95Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Win95TabContent>

                {/* Settings Tab */}
                <Win95TabContent value="settings" activeValue={activeTab}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="win95-sunken p-3">
                      <div className="text-[11px] font-bold mb-3">📄 Style Name</div>
                      <Win95Input
                        label="Name *"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={saving}
                      />
                    </div>

                    <div className="win95-sunken p-3">
                      <div className="text-[11px] font-bold mb-3">👤 Your Info</div>
                      <div className="space-y-2">
                        <Win95Input
                          label="Email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          disabled={saving}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Win95Input
                            label="First Name"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            disabled={saving}
                          />
                          <Win95Input
                            label="Last Name"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="win95-sunken p-3">
                      <div className="text-[11px] font-bold mb-3">📅 Delivery Days</div>
                      <div className="space-y-2">
                        <Win95Checkbox
                          checked={areAllDaysSelected(frequency)}
                          onCheckedChange={() => setFrequency(prev => toggleAllDays(prev))}
                          label="Every Day"
                          disabled={saving}
                        />
                        <div className="grid grid-cols-2 gap-1">
                          {DAYS.map(day => (
                            <Win95Checkbox
                              key={day.id}
                              checked={frequency.includes(day.id)}
                              onCheckedChange={() => handleToggleDay(day.id)}
                              label={day.short}
                              disabled={saving}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="win95-sunken p-3">
                      <div className="text-[11px] font-bold mb-3">🌐 Language</div>
                      <Win95Select
                        value={language}
                        onValueChange={setLanguage}
                        options={LANGUAGES.map(l => ({
                          value: l.code,
                          label: `${l.flag} ${l.label}`,
                        }))}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </Win95TabContent>
              </Win95Tabs>
            </div>
          </Win95Window>
        </div>
      </div>
    </ProtectedRoute>
  );
}
