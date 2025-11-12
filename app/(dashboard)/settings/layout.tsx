'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IdentificationIcon, PaintBrushIcon, CreditCardIcon, UsersIcon, ShieldCheckIcon, BellIcon, SettingsIcon } from '../../../components/icons/IconComponents';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';

const settingsTabs: { id: string; label: string; icon: React.ReactElement<{ className?: string }>; path: string }[] = [
  { id: 'Profile', label: 'Profile', icon: <IdentificationIcon />, path: '/settings/profile' },
  { id: 'Appearance', label: 'Appearance', icon: <PaintBrushIcon />, path: '/settings/appearance' },
  { id: 'Security', label: 'Security', icon: <ShieldCheckIcon />, path: '/settings/security' },
  { id: 'Notifications', label: 'Notifications', icon: <BellIcon />, path: '/settings/notifications' },
  { id: 'Billing', label: 'Billing', icon: <CreditCardIcon />, path: '/settings/billing' },
  { id: 'Team', label: 'Team', icon: <UsersIcon />, path: '/settings/team' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="settings-layout">
      {/* <div className="settings-header">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="settings-title">Settings</h1>
            <p className="settings-description">Manage your account settings and preferences</p>
          </div>
        </div>
      </div> */}
      
      <Card>
        <div className="border-b border-border">
          <nav className="flex gap-4 sm:gap-6 overflow-x-auto px-6" aria-label="Tabs">
            {settingsTabs.map((tab) => {
              const isActive = pathname === tab.path || (tab.path === '/settings/profile' && pathname === '/settings');
              return (
                <Link
                  key={tab.id}
                  href={tab.path}
                  className={cn(
                    "flex items-center px-1 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                    isActive
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {React.cloneElement(tab.icon, { 
                    className: cn(
                      'w-5 h-5 mr-2 flex-shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )
                  })}
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </Card>

      <Card className="min-h-[400px]">
        {children}
      </Card>
    </div>
  );
}

