'use client';

import React, { useState } from 'react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ChevronDownIcon } from '@components/icons';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export interface AnalyticsPanelProps {
  title: string;
  children: React.ReactNode;
  filters?: {
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  dateRange?: {
    start: Date;
    end: Date;
    onChange: (start: Date, end: Date) => void;
  };
  actions?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  variant?: 'default' | 'glass';
  className?: string;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  title,
  children,
  filters,
  dateRange,
  actions,
  collapsible = false,
  defaultCollapsed = false,
  variant = 'glass',
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const cardClassName = `analytics-panel-transition${className ? ' ' + className : ''}`;
  const chevronClassName = `analytics-panel__collapse-icon${isCollapsed ? ' analytics-panel__collapse-icon--rotated' : ''}`;
  
  return (
    <Card
      variant={variant === 'glass' ? 'glass' : 'default'}
      padding="lg"
      animate
      className={cardClassName}
    >
      {/* Header */}
      <div className="analytics-panel__header">
        <div className="analytics-panel__header-left">
          <h3 className="analytics-panel__title">{title}</h3>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="analytics-panel__collapse-btn"
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              <ChevronDownIcon className={chevronClassName} />
            </button>
          )}
        </div>
        {actions && <div className="analytics-panel__actions">{actions}</div>}
      </div>

      {/* Filters */}
      {!isCollapsed && (filters || dateRange) && (
        <div className="analytics-panel__filters">
          {filters?.map((filter) => (
            <div key={filter.label} className="analytics-panel__filter-group">
              <label className="analytics-panel__filter-label">
                {filter.label}:
              </label>
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="analytics-panel__filter-select"
              >
                {filter.options.map((option) => (
                  <option key={option.id} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {dateRange && (
            <div className="analytics-panel__filter-group">
              <label className="analytics-panel__filter-label">
                Date Range:
              </label>
              <input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newStart = new Date(e.target.value);
                  dateRange.onChange(newStart, dateRange.end);
                }}
                className="analytics-panel__filter-select"
              />
              <span className="analytics-panel__date-separator">to</span>
              <input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newEnd = new Date(e.target.value);
                  dateRange.onChange(dateRange.start, newEnd);
                }}
                className="analytics-panel__filter-select"
              />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {!isCollapsed && <div className="analytics-panel__content">{children}</div>}
    </Card>
  );
};

AnalyticsPanel.displayName = 'AnalyticsPanel';

