'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IdentificationIcon, PaintBrushIcon, CreditCardIcon, UsersIcon, ShieldCheckIcon, BellIcon, SettingsIcon, ArrowDownIcon, ChevronRightIcon, LoadingSpinner } from '@components/icons';
import { Card } from '@components/ui/Card';
import { ScrollProgress, useScrollProgress } from '@components/ui/ScrollProgress';
import { Tooltip } from '@components/ui/Tooltip';
import { useSettingsSwipe } from '@hooks/useSettingsSwipe';

const settingsTabs: { id: string; label: string; icon: React.ReactElement<{ className?: string }>; path: string; description: string }[] = [
  { id: 'Profile', label: 'Profile', icon: <IdentificationIcon />, path: '/settings/profile', description: 'Manage your personal information' },
  { id: 'Appearance', label: 'Appearance', icon: <PaintBrushIcon />, path: '/settings/appearance', description: 'Customize your theme' },
  { id: 'Security', label: 'Security', icon: <ShieldCheckIcon />, path: '/settings/security', description: 'Password and security settings' },
  { id: 'Notifications', label: 'Notifications', icon: <BellIcon />, path: '/settings/notifications', description: 'Manage notification preferences' },
  { id: 'Billing', label: 'Billing', icon: <CreditCardIcon />, path: '/settings/billing', description: 'Subscription and billing' },
  { id: 'Team', label: 'Team', icon: <UsersIcon />, path: '/settings/team', description: 'Manage team members' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollProgress = useScrollProgress();

  // Handle page refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate refresh - in real app, this would refetch data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    window.location.reload();
  }, []);

  // Setup swipe gestures
  const { swipeState, handlers } = useSettingsSwipe({
    tabs: settingsTabs,
    onRefresh: handleRefresh,
    enableTabNavigation: true,
    enablePullToRefresh: true,
  });

  // Handle scroll for dynamic blur
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className="settings-layout" 
      onTouchStart={handlers.onTouchStart}
      onTouchMove={handlers.onTouchMove}
      onTouchEnd={handlers.onTouchEnd}
      onMouseDown={handlers.onMouseDown}
      onMouseMove={handlers.onMouseMove}
      onMouseUp={handlers.onMouseUp}
    >
      {/* Scroll Progress Indicator */}
      <ScrollProgress
        variant="gradient"
        height={3}
        onProgressChange={(progress) => {
          // Trigger dynamic blur based on scroll progress
          if (progress > 10) {
            setIsScrolled(true);
          } else {
            setIsScrolled(false);
          }
        }}
      />

      {/* Pull to Refresh Indicator */}
      {swipeState.isPulling && (
        <div 
          className="settings-layout-pull-refresh"
          style={{ 
            opacity: Math.min(swipeState.deltaY / 100, 1),
            transform: `translateY(${Math.min(swipeState.deltaY * 0.5, 50)}px)`
          }}
        >
          <div className="settings-layout-pull-refresh-content">
            {swipeState.isRefreshing ? (
              <>
                <LoadingSpinner size="sm" className="settings-layout-pull-refresh-icon" />
                <span className="settings-layout-pull-refresh-text">Refreshing...</span>
              </>
            ) : (
              <>
                <ArrowDownIcon className="settings-layout-pull-refresh-icon" />
                <span className="settings-layout-pull-refresh-text">Pull to refresh</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Swipe Navigation Indicator */}
      {swipeState.isSwiping && Math.abs(swipeState.deltaX) > 20 && (
        <div 
          className="settings-layout-swipe-indicator"
          style={{
            [swipeState.direction === 'left' ? 'right' : 'left']: '20px',
            opacity: Math.min(Math.abs(swipeState.deltaX) / 80, 1),
          }}
        >
          <div 
            className={`settings-layout-swipe-indicator-content settings-layout-swipe-indicator-content--${swipeState.direction}`}
            style={{
              transform: swipeState.direction === 'left' ? 'rotate(0deg)' : 'rotate(180deg)'
            }}
          >
            <ChevronRightIcon className="settings-layout-swipe-indicator-icon" />
          </div>
        </div>
      )}

      {/* Settings Header */}
      <div className={`settings-layout-header ${isScrolled ? 'settings-layout-header--scrolled' : ''}`}>
        <div className="settings-layout-header-content">
          <div className="settings-layout-header-icon-wrapper">
            <SettingsIcon className="settings-layout-header-icon" />
          </div>
          <div>
            <h1 className="settings-layout-header-title">Settings</h1>
            <p className="settings-layout-header-description">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <Card 
        variant="glass-frosted" 
        className={`settings-layout-nav-card ${isScrolled ? 'settings-layout-nav-card--scrolled' : ''}`}
      >
        <div className="settings-layout-nav-border">
          <nav 
            className="settings-layout-nav" 
            aria-label="Settings Navigation"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {settingsTabs.map((tab) => {
              const isActive = pathname === tab.path || (tab.path === '/settings/profile' && pathname === '/settings');
              return (
                <Tooltip 
                  key={tab.id} 
                  content={tab.description}
                  side="bottom"
                >
                  <Link
                    href={tab.path}
                    className={`settings-layout-nav-link ${isActive ? 'settings-layout-nav-link--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {React.cloneElement(tab.icon, { 
                      className: `settings-layout-nav-link-icon ${isActive ? 'settings-layout-nav-link-icon--active' : ''}`
                    })}
                    <span className="settings-layout-nav-link-text">{tab.label}</span>
                  </Link>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* Tab Indicator Dots (Mobile) */}
        <div className="settings-layout-nav-dots">
          {settingsTabs.map((tab) => {
            const isActive = pathname === tab.path || (tab.path === '/settings/profile' && pathname === '/settings');
            return (
              <div
                key={`dot-${tab.id}`}
                className={`settings-layout-nav-dot ${isActive ? 'settings-layout-nav-dot--active' : ''}`}
              />
            );
          })}
        </div>
      </Card>

      {/* Content Area */}
      <Card 
        variant="glass-frosted" 
        className="settings-layout-content-card"
      >
        <div className="settings-layout-content">
          {children}
        </div>
      </Card>

      {/* Keyboard Shortcuts Hint */}
      <div className="settings-layout-shortcuts">
        <p className="settings-layout-shortcuts-text">
          <kbd className="settings-layout-shortcuts-key">Alt</kbd>
          {' + '}
          <kbd className="settings-layout-shortcuts-key">←</kbd>
          {' / '}
          <kbd className="settings-layout-shortcuts-key">→</kbd>
          {' to navigate tabs'}
        </p>
      </div>
    </div>
  );
}

