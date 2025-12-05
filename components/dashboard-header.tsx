'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, CreditCard, LayoutDashboard } from 'lucide-react';
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
    <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {user?.email?.split('@')[0]}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isOnDashboard && (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            )}
            <Link href="/dashboard/billing">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <CreditCard className="h-4 w-4" />
                Billing
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
