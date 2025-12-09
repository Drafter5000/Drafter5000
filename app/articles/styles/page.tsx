'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { StyleCard } from '@/components/articles/style-card';
import { Win95Window, Win95Button } from '@/components/win95';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import type { ArticleStyle } from '@/lib/types';

export default function ArticleStylesPage() {
  const { user } = useAuth();
  const [style, setStyle] = useState<ArticleStyle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStyles = async () => {
      if (!user) return;
      try {
        const data = await apiClient.get<ArticleStyle[]>(`/article-styles?user_id=${user.id}`);
        setStyle(data.length > 0 ? data[0] : null);
      } catch (err) {
        console.error('Failed to fetch styles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStyles();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    await apiClient.delete(`/article-styles/${id}?user_id=${user.id}`);
    setStyle(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <DashboardHeader />

          <Win95Window title="Your Article Style" icon={<span>📄</span>}>
            <div className="space-y-4">
              <div className="win95-sunken p-3">
                <div className="flex items-center gap-2">
                  <span className="text-[16px]">📄</span>
                  <div>
                    <h1 className="text-[12px] font-bold">Your Article Style</h1>
                    <p className="text-[10px] text-[var(--win95-button-shadow)]">
                      Manage your writing style and preferences
                    </p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <span className="text-[11px] win95-loading">Loading...</span>
                </div>
              ) : style ? (
                <div className="max-w-[300px]">
                  <StyleCard style={style} onDelete={handleDelete} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-[48px] mb-2">📄</div>
                  <h3 className="text-[12px] font-bold mb-1">No Article Style Yet</h3>
                  <p className="text-[10px] text-[var(--win95-button-shadow)] mb-4 max-w-[250px] mx-auto">
                    Create your article style to start generating personalized content.
                  </p>
                  <Link href="/articles/generate/step-1">
                    <Win95Button>+ Create Your Style</Win95Button>
                  </Link>
                </div>
              )}
            </div>
          </Win95Window>
        </div>
      </div>
    </ProtectedRoute>
  );
}
