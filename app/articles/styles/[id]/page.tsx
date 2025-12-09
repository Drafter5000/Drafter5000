'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { DeleteDialog } from '@/components/articles/delete-dialog';
import { Win95Window, Win95Button, Win95Badge } from '@/components/win95';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import type { ArticleStyle } from '@/lib/types';

const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  nl: '🇳🇱',
  ja: '🇯🇵',
  zh: '🇨🇳',
  ko: '🇰🇷',
};

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export default function StyleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [style, setStyle] = useState<ArticleStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchStyle = async () => {
      if (!user) return;
      try {
        const data = await apiClient.get<ArticleStyle>(`/article-styles/${id}?user_id=${user.id}`);
        setStyle(data);
      } catch (err) {
        console.error('Failed to fetch style:', err);
        router.push('/articles/styles');
      } finally {
        setLoading(false);
      }
    };
    fetchStyle();
  }, [user, id, router]);

  const handleDelete = async () => {
    if (!user || !style) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/article-styles/${id}?user_id=${user.id}`);
      router.push('/articles/styles');
    } finally {
      setDeleting(false);
    }
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

  const flag = LANGUAGE_FLAGS[style.preferred_language] || '🌐';

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <DashboardHeader />

          <Win95Window title={`Style: ${style.name}`} icon={<span>📄</span>}>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <Link href="/articles/styles">
                  <Win95Button size="sm">← Back</Win95Button>
                </Link>
                <div className="flex gap-1">
                  <Link href={`/articles/styles/${id}/edit`}>
                    <Win95Button size="sm">✏️ Edit</Win95Button>
                  </Link>
                  <Win95Button size="sm" onClick={() => setDeleteOpen(true)}>
                    🗑️ Delete
                  </Win95Button>
                </div>
              </div>

              {/* Title */}
              <div className="win95-sunken p-3 flex items-center gap-3">
                <div className="win95-raised p-2">
                  <span className="text-[24px]">📄</span>
                </div>
                <div>
                  <h1 className="text-[14px] font-bold">{style.name}</h1>
                  <p className="text-[10px] text-[var(--win95-button-shadow)]">
                    Created {new Date(style.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Delivery Info */}
                <div className="win95-sunken p-3">
                  <div className="text-[11px] font-bold mb-3">👤 Delivery Info</div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-[var(--win95-button-shadow)]">Email</p>
                      <p className="text-[11px]">📧 {style.email || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--win95-button-shadow)]">Display Name</p>
                      <p className="text-[11px]">{style.display_name || 'Not set'}</p>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="win95-sunken p-3">
                  <div className="text-[11px] font-bold mb-3">📅 Schedule</div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-[var(--win95-button-shadow)] mb-1">
                        Delivery Days
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {style.delivery_days.length === 0 ? (
                          <span className="text-[10px] text-[var(--win95-button-shadow)]">
                            No days selected
                          </span>
                        ) : style.delivery_days.length === 7 ? (
                          <Win95Badge>Every Day</Win95Badge>
                        ) : (
                          style.delivery_days.map(day => (
                            <Win95Badge key={day} variant="secondary">
                              {DAY_LABELS[day] || day}
                            </Win95Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--win95-button-shadow)]">Language</p>
                      <p className="text-[11px]">
                        {flag} {style.preferred_language.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Topics */}
                <div className="win95-sunken p-3 md:col-span-2">
                  <div className="text-[11px] font-bold mb-3">
                    📝 Topics ({style.subjects.length})
                  </div>
                  {style.subjects.length === 0 ? (
                    <p className="text-[10px] text-[var(--win95-button-shadow)]">No topics added</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-1">
                      {style.subjects.map((subject, index) => (
                        <div key={index} className="win95-raised p-2 flex items-center gap-2">
                          <Win95Badge variant="outline">{index + 1}</Win95Badge>
                          <span className="text-[11px]">{subject}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Style Samples */}
                <div className="win95-sunken p-3 md:col-span-2">
                  <div className="text-[11px] font-bold mb-3">
                    📄 Style Samples ({style.style_samples.length})
                  </div>
                  {style.style_samples.length === 0 ? (
                    <p className="text-[10px] text-[var(--win95-button-shadow)]">
                      No style samples added
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {style.style_samples.map((sample, index) => (
                        <div key={index} className="win95-field p-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Win95Badge variant="outline">{index + 1}</Win95Badge>
                            <span className="text-[10px] font-bold">Sample {index + 1}</span>
                            <span className="text-[9px] text-[var(--win95-button-shadow)] ml-auto">
                              {sample.split(/\s+/).length} words
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--win95-button-shadow)] whitespace-pre-wrap line-clamp-4">
                            {sample}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Win95Window>
        </div>
      </div>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Article Style"
        description={`Are you sure you want to delete "${style.name}"? This action cannot be undone.`}
      />
    </ProtectedRoute>
  );
}
