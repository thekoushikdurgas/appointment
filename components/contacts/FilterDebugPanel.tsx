'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@components/icons/IconComponents';
import { Button } from '@components/ui/Button';

interface FilterDebugPanelProps {
  filters: Record<string, any>;
  queryParams: Record<string, any>;
  isOpen?: boolean;
}

/**
 * FilterDebugPanel Component
 * 
 * A collapsible debug panel that displays:
 * - Active filters with their values
 * - Generated API query parameters
 * - Filter statistics by category
 * - Applied vs available filters ratio
 * 
 * Useful for debugging filter functionality and understanding what's being sent to the API.
 */
export const FilterDebugPanel: React.FC<FilterDebugPanelProps> = ({
  filters,
  queryParams,
  isOpen: initialOpen = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialOpen);

  // Calculate active filters
  const activeFilters = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (value === 'All' || value === '' || value === null || value === undefined) {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      return true;
    });
  }, [filters]);

  // Categorize filters
  const filtersByCategory = useMemo(() => {
    const categories: Record<string, number> = {
      'Text Filters': 0,
      'Exact Match': 0,
      'Numeric Range': 0,
      'Date Range': 0,
      'Location': 0,
      'Exclusion': 0,
      'Other': 0,
    };

    activeFilters.forEach(([key]) => {
      if (key.startsWith('exclude_')) {
        categories['Exclusion']++;
      } else if (key.endsWith('_min') || key.endsWith('_max')) {
        categories['Numeric Range']++;
      } else if (key.endsWith('_after') || key.endsWith('_before')) {
        categories['Date Range']++;
      } else if (key.includes('location')) {
        categories['Location']++;
      } else if (['email_status', 'stage', 'seniority', 'primary_email_catch_all_status', 'employees_count', 'annual_revenue', 'total_funding'].includes(key)) {
        categories['Exact Match']++;
      } else if (['first_name', 'last_name', 'title', 'company', 'email', 'city', 'state', 'country', 'industry', 'technologies', 'keywords', 'tags'].includes(key)) {
        categories['Text Filters']++;
      } else {
        categories['Other']++;
      }
    });

    // Remove categories with 0 count
    return Object.entries(categories).filter(([_, count]) => count > 0);
  }, [activeFilters]);

  const totalFilters = Object.keys(filters).length;
  const activeFilterCount = activeFilters.length;

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '(empty)';
    if (value === 'All') return '(All)';
    if (Array.isArray(value)) {
      return value.length === 0 ? '[]' : `[${value.join(', ')}]`;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (!isExpanded) {
    return (
      <div className="filter-debug-panel">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="filter-debug-panel__toggle-btn"
        >
          <span style={{ marginRight: '0.5rem' }}>🐛</span>
          Filter Debug ({activeFilterCount})
          <ChevronUpIcon className="filter-debug-panel__toggle-icon" />
        </Button>
      </div>
    );
  }

  return (
    <div className="filter-debug-panel__panel">
      {/* Header */}
      <div className="filter-debug-panel__header">
        <div className="filter-debug-panel__header-left">
          <span className="filter-debug-panel__header-icon">🐛</span>
          <h3 className="filter-debug-panel__header-title">Filter Debug Panel</h3>
          <span className="filter-debug-panel__header-badge">
            {activeFilterCount} active
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          iconOnly
          style={{ height: '2rem', width: '2rem' }}
        >
          <ChevronDownIcon className="filter-debug-panel__header-close-icon" />
        </Button>
      </div>

      {/* Content */}
      <div className="filter-debug-panel__body">
        {/* Statistics */}
        <div className="filter-debug-panel__section">
          <h4 className="filter-debug-panel__section-title">Statistics</h4>
          <div className="filter-debug-panel__stats-grid">
            <div className="filter-debug-panel__stat-item">
              <span className="filter-debug-panel__stat-label">Total Filters:</span>
              <span className="filter-debug-panel__stat-value">{totalFilters}</span>
            </div>
            <div className="filter-debug-panel__stat-item">
              <span className="filter-debug-panel__stat-label">Active:</span>
              <span className="filter-debug-panel__stat-value filter-debug-panel__stat-value--primary">{activeFilterCount}</span>
            </div>
            <div className="filter-debug-panel__stat-item filter-debug-panel__stat-item--full">
              <span className="filter-debug-panel__stat-label">Usage:</span>
              <span className="filter-debug-panel__stat-value">
                {totalFilters > 0 ? Math.round((activeFilterCount / totalFilters) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Filter Categories */}
        {filtersByCategory.length > 0 && (
          <div className="filter-debug-panel__section">
            <h4 className="filter-debug-panel__section-title">By Category</h4>
            <div className="filter-debug-panel__category-list">
              {filtersByCategory.map(([category, count]) => (
                <div key={category} className="filter-debug-panel__category-item">
                  <span className="filter-debug-panel__category-label">{category}:</span>
                  <span className="filter-debug-panel__category-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters */}
        <div className="filter-debug-panel__section">
          <h4 className="filter-debug-panel__section-title">Active Filters</h4>
          {activeFilters.length === 0 ? (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>No active filters</p>
          ) : (
            <div className="filter-debug-panel__filters-list">
              {activeFilters.map(([key, value]) => (
                <div key={key} className="filter-debug-panel__filter-item">
                  <div className="filter-debug-panel__filter-key">{key}</div>
                  <div className="filter-debug-panel__filter-value">
                    {formatValue(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Query Parameters */}
        <div className="filter-debug-panel__section">
          <h4 className="filter-debug-panel__section-title">API Query Parameters</h4>
          {Object.keys(queryParams).length === 0 ? (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>No query parameters</p>
          ) : (
            <div className="filter-debug-panel__filters-list">
              {Object.entries(queryParams).map(([key, value]) => (
                <div key={key} className="filter-debug-panel__filter-item">
                  <div className="filter-debug-panel__filter-key">{key}</div>
                  <div className="filter-debug-panel__filter-value">
                    {formatValue(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Query String Preview */}
        <div className="filter-debug-panel__section">
          <h4 className="filter-debug-panel__section-title">Query String</h4>
          <div className="filter-debug-panel__query-string">
            {Object.keys(queryParams).length === 0
              ? '(no parameters)'
              : new URLSearchParams(
                  Object.entries(queryParams).reduce((acc, [key, value]) => {
                    if (Array.isArray(value)) {
                      value.forEach(v => acc.append(key, String(v)));
                    } else {
                      acc.set(key, String(value));
                    }
                    return acc;
                  }, new URLSearchParams())
                ).toString()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="filter-debug-panel__footer">
        <p className="filter-debug-panel__footer-text">
          💡 Tip: Use <code className="filter-debug-panel__footer-code">filterLogger.enable()</code> in console for detailed logs
        </p>
      </div>
    </div>
  );
};

