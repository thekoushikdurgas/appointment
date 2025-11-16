/**
 * Company Contacts Empty State Component
 * 
 * Displays appropriate message and actions when no contacts are found.
 * Supports different variants for different scenarios.
 */

'use client';

import React from 'react';
import { UsersIcon, SearchIcon, FilterIcon, AlertTriangleIcon } from '@components/icons/IconComponents';
import { Button } from '@components/ui/Button';

interface CompanyContactsEmptyStateProps {
  variant?: 'no-contacts' | 'no-results';
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const CompanyContactsEmptyState: React.FC<CompanyContactsEmptyStateProps> = ({
  variant = 'no-contacts',
  onAction,
  actionLabel,
  className,
}) => {
  const config = {
    'no-contacts': {
      icon: UsersIcon,
      title: 'No Contacts Found',
      description: 'This company doesn\'t have any contacts yet.',
      defaultActionLabel: 'Add Contact',
      iconColor: 'text-muted-foreground',
    },
    'no-results': {
      icon: SearchIcon,
      title: 'No Matching Contacts',
      description: 'No contacts match your current search or filter criteria. Try adjusting your filters or search term.',
      defaultActionLabel: 'Clear Filters',
      iconColor: 'text-primary',
    },
  };

  const { icon: Icon, title, description, defaultActionLabel, iconColor } = config[variant];

  return (
    <div className={`company-contacts-empty-state${className ? ' ' + className : ''}`}>
      {/* Icon */}
      <div className="company-contacts-empty-state__icon-wrapper">
        <Icon className={`company-contacts-empty-state__icon${iconColor === 'text-muted-foreground' ? ' company-contacts-empty-state__icon--muted' : iconColor === 'text-primary' ? ' company-contacts-empty-state__icon--primary' : ''}`} />
      </div>

      {/* Title */}
      <h3 className="company-contacts-empty-state__title">
        {title}
      </h3>

      {/* Description */}
      <p className="company-contacts-empty-state__description">
        {description}
      </p>

      {/* Action Button */}
      {onAction && (
        <Button
          variant="primary"
          onClick={onAction}
          leftIcon={variant === 'no-results' ? <FilterIcon /> : undefined}
        >
          {actionLabel || defaultActionLabel}
        </Button>
      )}

      {/* Additional Help Text */}
      {variant === 'no-results' && (
        <p className="company-contacts-empty-state__help-text">
          Tip: Try using broader search terms or removing some filters
        </p>
      )}
    </div>
  );
};

/**
 * Error State Component
 */
interface CompanyContactsErrorStateProps {
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export const CompanyContactsErrorState: React.FC<CompanyContactsErrorStateProps> = ({
  error = 'Failed to load contacts',
  onRetry,
  className,
}) => {
  return (
    <div className={`company-contacts-error-state${className ? ' ' + className : ''}`}>
      {/* Error Icon */}
      <div className="company-contacts-error-state__icon-wrapper">
        <AlertTriangleIcon className="company-contacts-error-state__icon" />
      </div>

      {/* Title */}
      <h3 className="company-contacts-error-state__title">
        Oops! Something went wrong
      </h3>

      {/* Error Message */}
      <p className="company-contacts-error-state__message">
        {error}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

