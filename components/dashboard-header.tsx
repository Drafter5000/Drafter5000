'use client';

import { useAuth } from '@/components/auth-provider';
import { Win95Button } from '@/components/win95';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isOnDashboard = pathname === '/dashboard';

  return (
    <header className="win95-raised p-1 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[16px]">📊</span>
          <div>
            <h1 className="text-[12px] font-bold">Dashboard</h1>
            <p className="text-[10px] text-[var(--win95-button-shadow)]">
              Welcome back, {user?.email?.split('@')[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isOnDashboard && (
            <Link href="/dashboard">
              <Win95Button size="sm">📊 Dashboard</Win95Button>
            </Link>
          )}
          <Link href="/dashboard/billing">
            <Win95Button size="sm">💳 Billing</Win95Button>
          </Link>
          <Link href="/dashboard/settings">
            <Win95Button size="sm">⚙️ Settings</Win95Button>
          </Link>
          <Win95Button size="sm" onClick={handleSignOut}>
            🚪 Sign Out
          </Win95Button>
        </div>
      </div>
    </header>
  );
}
