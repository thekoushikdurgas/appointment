'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardIcon, ContactsIcon, SparklesIcon, PlansIcon, SettingsIcon } from '../icons/IconComponents';
import { cn } from '../../utils/cn';

interface NavItem {
  path: string;
  icon: React.ReactElement<{ className?: string }>;
  label: string;
}

const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { path: '/dashboard', icon: <DashboardIcon />, label: 'Home' },
    { path: '/contacts', icon: <ContactsIcon />, label: 'Contacts' },
    { path: '/ai-assistant', icon: <SparklesIcon />, label: 'AI' },
    { path: '/plans', icon: <PlansIcon />, label: 'Plans' },
    { path: '/settings', icon: <SettingsIcon />, label: 'Settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/settings') {
      return pathname.startsWith('/settings');
    }
    return pathname === path;
  };

  return (
    <nav className="bottom-nav md:hidden">
      <div className="bottom-nav-content">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'bottom-nav-item',
                active && 'bottom-nav-item-active'
              )}
            >
              <span className={cn(
                'bottom-nav-icon',
                active && 'bottom-nav-icon-active'
              )}>
                {React.cloneElement(item.icon, { 
                  className: cn('w-6 h-6', active && 'text-primary') 
                })}
              </span>
              <span className={cn(
                'bottom-nav-label',
                active && 'bottom-nav-label-active'
              )}>
                {item.label}
              </span>
              {active && (
                <span className="bottom-nav-indicator"></span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

