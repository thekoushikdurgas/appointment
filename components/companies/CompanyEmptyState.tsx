/**
 * CompanyEmptyState Component
 * 
 * Illustrated empty state with helpful messaging and call-to-action
 * for when no companies are found or the list is empty.
 */

'use client';

import React from 'react';
import { BuildingIcon, PlusIcon, SearchIcon, FilterIcon } from '../icons/IconComponents';
import { Button } from '../ui/Button';

interface CompanyEmptyStateProps {
  variant?: 'no-data' | 'no-results' | 'no-filters';
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const CompanyEmptyState: React.FC<CompanyEmptyStateProps> = ({
  variant = 'no-data',
  onAction,
  actionLabel,
  className,
}) => {
  const getContent = () => {
    switch (variant) {
      case 'no-results':
        return {
          icon: SearchIcon,
          title: 'No Companies Found',
          description: 'We couldn\'t find any companies matching your search criteria. Try adjusting your filters or search terms.',
          action: actionLabel || 'Clear Filters',
          showIcon: true,
        };
      case 'no-filters':
        return {
          icon: FilterIcon,
          title: 'No Matches',
          description: 'No companies match the selected filters. Try broadening your filter criteria to see more results.',
          action: actionLabel || 'Reset Filters',
          showIcon: true,
        };
      case 'no-data':
      default:
        return {
          icon: BuildingIcon,
          title: 'No Companies Yet',
          description: 'Get started by adding your first company to the database. You can import companies or add them manually.',
          action: actionLabel || 'Add Company',
          showIcon: true,
        };
    }
  };

  const content = getContent();
  const IconComponent = content.icon;

  return (
    <div className={`company-empty-state${className ? ' ' + className : ''}`}>
      {/* Animated Icon */}
      <div className="company-empty-state__icon-wrapper">
        <div className="company-empty-state-icon company-glow-pulse">
          <IconComponent className="company-empty-state__icon" />
        </div>
        {variant === 'no-data' && (
          <div className="company-empty-state__icon-badge">
            <PlusIcon className="company-empty-state__icon-badge-icon" />
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="company-empty-state-title">
        {content.title}
      </h3>

      {/* Description */}
      <p className="company-empty-state-description">
        {content.description}
      </p>

      {/* Action Button */}
      {onAction && (
        <Button
          onClick={onAction}
          variant="primary"
          size="lg"
          className="company-empty-state__action animate-scale-in"
        >
          {variant === 'no-data' && <PlusIcon className="company-empty-state__action-icon" />}
          {content.action}
        </Button>
      )}

      {/* Helpful Tips */}
      {variant === 'no-results' && (
        <div className="company-empty-state__tips">
          <p className="company-empty-state__tips-title">Search Tips:</p>
          <ul className="company-empty-state__tips-list">
            <li>Check your spelling</li>
            <li>Try more general keywords</li>
            <li>Remove some filters</li>
            <li>Search by industry or location</li>
          </ul>
        </div>
      )}

      {variant === 'no-data' && (
        <div className="company-empty-state__features">
          <div className="company-empty-state__feature">
            <div className="company-empty-state__feature-icon-wrapper">
              <BuildingIcon className="company-empty-state__feature-icon" />
            </div>
            <span>Add companies manually</span>
          </div>
          <div className="company-empty-state__feature">
            <div className="company-empty-state__feature-icon-wrapper">
              <SearchIcon className="company-empty-state__feature-icon" />
            </div>
            <span>Search and filter easily</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Mini empty state for inline use
export const CompanyMiniEmptyState: React.FC<{
  message?: string;
  className?: string;
}> = ({   message = 'No companies to display', className }) => {
  return (
    <div className={`company-mini-empty-state${className ? ' ' + className : ''}`}>
      <BuildingIcon className="company-mini-empty-state__icon" />
      <p className="company-mini-empty-state__text">{message}</p>
    </div>
  );
};

