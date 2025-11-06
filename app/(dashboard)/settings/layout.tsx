'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IdentificationIcon, PaintBrushIcon, CreditCardIcon, UsersIcon, ShieldCheckIcon, BellIcon } from '../../../components/icons/IconComponents';

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
          {settingsTabs.map((tab) => {
            const isActive = pathname === tab.path || (tab.path === '/settings/profile' && pathname === '/settings');
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`flex items-center px-1 py-3 text-sm font-medium border-b-2 whitespace-nowrap group ${
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {React.cloneElement(tab.icon, { className: 'w-5 h-5 mr-2 flex-shrink-0' })}
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md border border-border min-h-[400px]">
        {children}
      </div>
    </div>
  );
}

