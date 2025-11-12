'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { MenuIcon } from '../../components/icons/IconComponents';
import { Button } from '../../components/ui/Button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isLoggingOut } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  // Sidebar is always collapsed by default on desktop, only expands temporarily on hover/click
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);

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
    <div className="dashboard-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        setOpen={setSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className="dashboard-main">
        <main className="dashboard-content pb-20 md:pb-0">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => setSidebarOpen(true)}
            className="hidden sm:block lg:hidden mb-4"
            aria-label="Open sidebar"
          >
            <MenuIcon className="w-5 h-5" />
          </Button>
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}


