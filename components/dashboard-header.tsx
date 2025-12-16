'use client';

import { useContext } from 'react';
import { useAuth } from '@/components/auth-provider';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { Win95Button } from '@/components/win95';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, Settings, LogOut, Monitor, Palette } from 'lucide-react';

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
  const toggleAndReload = context?.toggleAndReload;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isOnDashboard = pathname === '/dashboard';

  // Win95 Design Header
  if (designMode === 'win95') {
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
            <Win95Button size="sm" onClick={toggleAndReload} title="Switch to Modern Design">
              🎨 Modern
            </Win95Button>
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

  // Modern Design Header
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                Welcome back, {user?.email?.split('@')[0]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* <Button∏∏∏
              variant="outline"
              size="sm"
              onClick={toggleAndReload}
              title="Switch to Win95 Design"
            >
              <Monitor className="h-4 w-4 mr-1" />
              Win95
            </Button> */}
            {!isOnDashboard && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
            )}
            <Link href="/dashboard/billing">
              <Button variant="ghost" size="sm">
                <CreditCard className="h-4 w-4 mr-1" />
                Billing
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
