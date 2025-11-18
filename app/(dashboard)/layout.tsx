'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@hooks/useAuth';
import Sidebar from '@components/layout/Sidebar';
import BottomNav from '@components/layout/BottomNav';
import { MenuIcon } from '@components/icons';
import { Button } from '@components/ui/Button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isLoggingOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  // Sidebar is always collapsed by default on desktop, only expands temporarily on hover/click
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Check if current route is a detail page that should hide sidebar
  const isDetailPage = pathname?.match(/^\/(contacts|companies)\/[^/]+$/) !== null;

  useEffect(() => {
    if (!isLoading && !isLoggingOut && !user) {
      router.push('/');
    }
  }, [user, isLoading, isLoggingOut, router]);

  if (isLoading || isLoggingOut) {
    return null; // Will be handled by loading.tsx
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className={`dashboard-layout${isDetailPage ? ' dashboard-layout--no-sidebar' : ''}`}>
      {!isDetailPage && (
        <Sidebar
          isOpen={isSidebarOpen}
          setOpen={setSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      )}
      <div className="dashboard-main">
        <main className="dashboard-content">
          {!isDetailPage && (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() => setSidebarOpen(true)}
              className="dashboard-sidebar-toggle"
              aria-label="Open sidebar"
            >
              <MenuIcon className="dashboard-sidebar-toggle-icon" />
            </Button>
          )}
          {children}
        </main>
      </div>
      {!isDetailPage && <BottomNav />}
    </div>
  );
}


