'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import { MenuIcon } from '../../components/icons/IconComponents';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isLoggingOut } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    <div className="flex h-screen bg-secondary text-foreground overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        setOpen={setSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col transition-all duration-300">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-muted-foreground mb-4 p-2 rounded-md hover:bg-muted">
              <MenuIcon />
          </button>
          {children}
        </main>
      </div>
    </div>
  );
}


