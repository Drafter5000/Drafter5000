'use client';

import { useState, useEffect, useContext } from 'react';
import { useAuth } from '@/components/auth-provider';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { StyleCard } from '@/components/articles/style-card';
import { Win95Window, Win95Button } from '@/components/win95';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import type { ArticleStyle } from '@/lib/types';

export default function ArticleStylesPage() {
  const { user } = useAuth();
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
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

  // Win95 Design
  if (designMode === 'win95') {
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

  // Modern Design
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="pt-8 pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Article Styles</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your writing styles and preferences
                  </p>
                </div>
              </div>
              <Link href="/articles/generate/step-1">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Style
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : style ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StyleCard style={style} onDelete={handleDelete} />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Article Style Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create your article style to start generating personalized content.
                </p>
                <Link href="/articles/generate/step-1">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your Style
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
