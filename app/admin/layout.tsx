'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { Loader2 } from 'lucide-react';
import type { AdminSession } from '@/lib/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Skip auth check for login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/auth/session');
        if (!res.ok) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        setSession(data.session);
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show login page without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied if no session
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Access Denied</p>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this area.
          </p>
          <button
            onClick={() => router.push('/admin/login')}
            className="text-primary hover:underline"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname.startsWith('/admin/users')) return 'Users';
    if (pathname.startsWith('/admin/organizations')) return 'Organizations';
    if (pathname.startsWith('/admin/plans')) return 'Plans';
    if (pathname.startsWith('/admin/settings')) return 'Settings';
    return '';
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar onLogout={handleLogout} />
      <div className="pl-64">
        <AdminHeader session={session} title={getPageTitle()} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
