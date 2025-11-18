'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardIcon, ContactsIcon, BuildingIcon, SparklesIcon, PlansIcon, SettingsIcon } from '@components/icons';

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
    { path: '/companies', icon: <BuildingIcon />, label: 'Companies' },
    { path: '/ai-assistant', icon: <SparklesIcon />, label: 'AI' },
    { path: '/settings', icon: <SettingsIcon />, label: 'Settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/settings') {
      return pathname.startsWith('/settings');
    }
    return pathname === path;
  };

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-content">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const itemClassName = `bottom-nav-item${active ? ' bottom-nav-item-active' : ''}`;
          const iconClassName = `bottom-nav-icon${active ? ' bottom-nav-icon-active' : ''}`;
          const labelClassName = `bottom-nav-label${active ? ' bottom-nav-label-active' : ''}`;
          const iconElementClassName = active ? 'bottom-nav-icon-element--active' : 'bottom-nav-icon-element';
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={itemClassName}
            >
              <span className={iconClassName}>
                {React.cloneElement(item.icon, { 
                  className: iconElementClassName
                })}
              </span>
              <span className={labelClassName}>
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

