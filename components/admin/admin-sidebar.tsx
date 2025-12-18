'use client';

import { Button } from '@/components/ui/button';
import { hasPlatformAccess, mapToUserRole } from '@/lib/role-config';
import type { AdminSession } from '@/lib/types';
import { UserRoleType } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** If true, only Super Admins can see this item */
  superAdminOnly?: boolean;
}

// Navigation items with access control
const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Organizations',
    href: '/admin/organizations',
    icon: Building2,
    superAdminOnly: true,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Billing',
    href: '/admin/billing',
    icon: Receipt,
  },
  // {
  //   title: 'Usage',
  //   href: '/admin/usage',
  //   icon: BarChart3,
  // },
  {
    title: 'Plans',
    href: '/admin/plans',
    icon: CreditCard,
    superAdminOnly: true,
  },
  {
    title: 'AI Prompts',
    href: '/admin/prompts',
    icon: Sparkles,
    superAdminOnly: true,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    superAdminOnly: true,
  },
];

interface AdminSidebarProps {
  session?: AdminSession | null;
  onLogout?: () => void;
}

export function AdminSidebar({ session, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  // Determine user's role type
  const userRoleType = session
    ? mapToUserRole(session.role, session.is_super_admin)
    : UserRoleType.CUSTOMER;

  const isPlatformAdmin = hasPlatformAccess(userRoleType);

  // Filter navigation items based on role
  const visibleNavItems = navItems.filter(item => {
    if (item.superAdminOnly && !isPlatformAdmin) {
      return false;
    }
    return true;
  });

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Admin Panel</span>
        </div>

        {/* Role indicator */}
        {session && (
          <div className="px-6 py-3 border-b">
            <p className="text-xs text-muted-foreground">Logged in as</p>
            <p className="text-sm font-medium truncate">{session.email}</p>
            <p className="text-xs text-primary capitalize">{userRoleType.replace('_', ' ')}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {visibleNavItems.map(item => {
            const isActive =
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-primary/10 text-primary'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
