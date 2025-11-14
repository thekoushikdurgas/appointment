'use client';

import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'glass' | 'pills';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'glass',
  fullWidth = false,
  className,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab?.disabled) return;

    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  const containerClassName = `tabs-list tabs-list--${variant}${fullWidth ? ' tabs-list--full-width' : ''}`;
  
  return (
    <div className={`tabs-container${className ? ' ' + className : ''}`}>
      {/* Tab List */}
      <div
        className={containerClassName}
        role="tablist"
      >
        {tabs.map((tab) => {
          const tabClassName = `tab-button tab-button--${variant}${activeTab === tab.id ? ` tab-button--${variant}-active` : ''}${fullWidth ? ' tab-button--full-width' : ''}`;
          
          return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => handleTabChange(tab.id)}
            className={tabClassName}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
        })}
      </div>

      {/* Tab Panels */}
      <div className="tab-panels">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`tabpanel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            className={`tab-panel${activeTab === tab.id ? ' tab-panel--active' : ''}`}
          >
            {activeTab === tab.id && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

Tabs.displayName = 'Tabs';

